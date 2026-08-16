import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { v2 as cloudinary } from "cloudinary";
import {
  asCloudinaryApiError,
  backupSourceFiles,
  buildCloudinaryUrl,
  createManifestDir,
  delay,
  ManifestState,
  ParsedCloudinaryUrl,
  parseCloudinaryUrl,
  saveManifest,
  validateConfig
} from "./lib/cloudinary-blog-utils";

type FrontmatterImageField = "image" | "ogImage";

interface MdxPost {
  sourceFile: string;
  slug: string;
  image: string;
  ogImage?: string;
}

interface AssetReference {
  sourceFile: string;
  slug: string;
  field: FrontmatterImageField;
  originalUrl: string;
  parsed: ParsedCloudinaryUrl;
}

interface RenamePlan {
  originalUrl: string;
  parsed: ParsedCloudinaryUrl;
  newPublicId: string;
  references: AssetReference[];
}

interface SourceUpdate {
  field: FrontmatterImageField;
  originalUrl: string;
  newUrl: string;
}

const contentDir = path.join(process.cwd(), "content", "blog");

function requiredFrontmatterString(
  data: Record<string, unknown>,
  field: "slug" | "image",
  sourceFile: string
) {
  const value = data[field];
  if (typeof value !== "string" || !value) {
    throw new Error(sourceFile + ': frontmatter "' + field + '" must be a non-empty string.');
  }

  return value;
}

function getMdxPosts(): MdxPost[] {
  const files = fs
    .readdirSync(contentDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"))
    .map((entry) => entry.name)
    .sort();
  const slugs = new Set<string>();

  return files.map((file) => {
    const sourceFile = path.join(contentDir, file);
    const source = fs.readFileSync(sourceFile, "utf-8");
    const frontmatter = matter(source).data as Record<string, unknown>;
    const fileSlug = file.slice(0, -".mdx".length);
    const slug = requiredFrontmatterString(frontmatter, "slug", sourceFile);
    const image = requiredFrontmatterString(frontmatter, "image", sourceFile);
    const ogImage = frontmatter.ogImage;

    if (slug !== fileSlug) {
      throw new Error(
        sourceFile + ': frontmatter slug "' + slug + '" must match filename "' + fileSlug + '".'
      );
    }
    if (slugs.has(slug)) {
      throw new Error('Duplicate MDX blog slug: "' + slug + '".');
    }
    if (ogImage !== undefined && typeof ogImage !== "string") {
      throw new Error(sourceFile + ': frontmatter "ogImage" must be a string when present.');
    }

    slugs.add(slug);
    return { sourceFile, slug, image, ogImage };
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^\x24{}()|[\]\\]/g, "\\$&");
}

function replaceFrontmatterUrl(
  source: string,
  field: FrontmatterImageField,
  originalUrl: string,
  newUrl: string,
  sourceFile: string
) {
  const frontmatterMatch = source.match(/^(---\r?\n)([\s\S]*?)(\r?\n---(?:\r?\n|$))/);
  if (!frontmatterMatch || frontmatterMatch.index === undefined) {
    throw new Error("Missing frontmatter in " + sourceFile + ".");
  }

  const fieldPattern = escapeRegExp(field);
  const urlPattern = escapeRegExp(originalUrl);
  const quotedValuePattern = new RegExp(
    "(^[\\t ]*" +
      fieldPattern +
      "[\\t ]*:[\\t ]*)([\"'])" +
      urlPattern +
      "\\2([\\t ]*(?:#.*)?$)",
    "m"
  );
  const unquotedValuePattern = new RegExp(
    "(^[\\t ]*" +
      fieldPattern +
      "[\\t ]*:[\\t ]*)" +
      urlPattern +
      "([\\t ]*(?:#.*)?$)",
    "m"
  );
  const frontmatter = frontmatterMatch[2];
  let replacements = 0;
  let updatedFrontmatter = frontmatter.replace(
    quotedValuePattern,
    (_match, prefix: string, quote: string, suffix: string) => {
      replacements += 1;
      return prefix + quote + newUrl + quote + suffix;
    }
  );

  if (replacements === 0) {
    updatedFrontmatter = frontmatter.replace(
      unquotedValuePattern,
      (_match, prefix: string, suffix: string) => {
        replacements += 1;
        return prefix + newUrl + suffix;
      }
    );
  }

  if (replacements !== 1) {
    throw new Error(
      'Could not exact-replace frontmatter "' + field + '" URL in ' + sourceFile + "."
    );
  }

  const matchStart = frontmatterMatch.index;
  const matchEnd = matchStart + frontmatterMatch[0].length;
  return (
    source.slice(0, matchStart) +
    frontmatterMatch[1] +
    updatedFrontmatter +
    frontmatterMatch[3] +
    source.slice(matchEnd)
  );
}

function buildSourceUpdates(validRenames: RenamePlan[]) {
  const sourceUpdates = new Map<string, SourceUpdate[]>();

  for (const rename of validRenames) {
    for (const reference of rename.references) {
      const update: SourceUpdate = {
        field: reference.field,
        originalUrl: reference.originalUrl,
        newUrl: buildCloudinaryUrl(reference.parsed, rename.newPublicId)
      };
      const updates = sourceUpdates.get(reference.sourceFile) ?? [];
      const existingUpdate = updates.find((item) => item.field === update.field);

      if (
        existingUpdate &&
        (existingUpdate.originalUrl !== update.originalUrl || existingUpdate.newUrl !== update.newUrl)
      ) {
        throw new Error(
          "Conflicting frontmatter updates for " + reference.sourceFile + " field " + update.field + "."
        );
      }
      if (!existingUpdate) {
        updates.push(update);
        sourceUpdates.set(reference.sourceFile, updates);
      }
    }
  }

  return sourceUpdates;
}

function prepareUpdatedSources(sourceUpdates: Map<string, SourceUpdate[]>) {
  const updatedSources = new Map<string, string>();

  for (const [sourceFile, updates] of sourceUpdates) {
    let source = fs.readFileSync(sourceFile, "utf-8");
    for (const update of updates) {
      source = replaceFrontmatterUrl(
        source,
        update.field,
        update.originalUrl,
        update.newUrl,
        sourceFile
      );
    }
    updatedSources.set(sourceFile, source);
  }

  return updatedSources;
}

async function main() {
  const args = process.argv.slice(2);
  const isApply = args.includes("--apply");
  const isDryRun = !isApply || args.includes("--dry-run");
  const config = validateConfig();

  console.log("[Preflight] Validating credentials for cloud: " + config.cloudName);
  try {
    await cloudinary.api.ping();
  } catch {
    console.error("Cloudinary ping failed! Invalid credentials.");
    process.exit(1);
  }

  const plansByPublicId = new Map<string, RenamePlan>();
  const plansByTargetPublicId = new Map<string, RenamePlan>();

  const addReference = (
    post: MdxPost,
    field: FrontmatterImageField,
    url: string,
    targetName: string
  ) => {
    const parsed = parseCloudinaryUrl(url, config.cloudName);
    if (!parsed) return;

    const newPublicId = "lentiny/blog/" + post.slug + "/" + targetName;
    const reference: AssetReference = {
      sourceFile: post.sourceFile,
      slug: post.slug,
      field,
      originalUrl: url,
      parsed
    };
    const existingPlan = plansByPublicId.get(parsed.publicId);

    if (existingPlan) {
      const firstReference = existingPlan.references[0];
      if (firstReference.slug !== post.slug) {
        console.warn(
          "[Warn] Asset " +
            parsed.publicId +
            " is shared by multiple posts. It will use the first assigned public ID: " +
            existingPlan.newPublicId +
            "."
        );
      }
      existingPlan.references.push(reference);
      return;
    }

    const targetPlan = plansByTargetPublicId.get(newPublicId);
    if (targetPlan && targetPlan.parsed.publicId !== parsed.publicId) {
      throw new Error("Duplicate target public ID detected in plan: " + newPublicId);
    }

    const plan: RenamePlan = {
      originalUrl: url,
      parsed,
      newPublicId,
      references: [reference]
    };
    plansByPublicId.set(parsed.publicId, plan);
    plansByTargetPublicId.set(newPublicId, plan);
  };

  for (const post of getMdxPosts()) {
    addReference(post, "image", post.image, "cover");
    if (post.ogImage) {
      addReference(post, "ogImage", post.ogImage, "og-cover");
    }
  }

  const renames = [...plansByPublicId.values()].filter(
    (plan) => plan.parsed.publicId !== plan.newPublicId
  );

  if (renames.length === 0) {
    console.log("No assets to rename. Everything is up to date!");
    process.exit(0);
  }

  console.log("\n[Preflight] Found " + renames.length + " assets to rename.");
  console.log("[Preflight] Verifying source assets exist and targets are free...");
  const validRenames: RenamePlan[] = [];

  for (const item of renames) {
    let sourceExists = true;
    try {
      await cloudinary.api.resource(item.parsed.publicId);
    } catch (error: unknown) {
      const apiError = asCloudinaryApiError(error);
      if (apiError.http_code === 404 || apiError.error?.http_code === 404) {
        console.warn("[Preflight Warn] Asset not found ON CLOUDINARY (404): " + item.parsed.publicId + ".");
        console.warn("   -> The URL exists in source, but the image is missing from Cloudinary. Skipping it.");
        sourceExists = false;
      } else {
        throw error;
      }
    }

    if (!sourceExists) continue;

    validRenames.push(item);

    try {
      await cloudinary.api.resource(item.newPublicId);
      console.error("[Preflight Error] Target asset already exists: " + item.newPublicId);
      process.exit(1);
    } catch (error: unknown) {
      const apiError = asCloudinaryApiError(error);
      if (apiError.http_code !== 404 && apiError.error?.http_code !== 404) {
        throw error;
      }
    }
  }

  console.log("[Preflight] All checks passed.");

  if (isDryRun) {
    console.log("\n[Dry Run] Planned renames:");
    for (const item of validRenames) {
      console.log("  " + item.parsed.publicId + " -> " + item.newPublicId);
    }
    console.log("\nRun with --apply to execute.");
    process.exit(0);
  }

  if (validRenames.length === 0) {
    console.log("No valid assets left to rename after filtering missing sources.");
    process.exit(0);
  }

  const sourceUpdates = buildSourceUpdates(validRenames);
  const updatedSources = prepareUpdatedSources(sourceUpdates);
  const manifestDir = createManifestDir();
  const sourceFiles = backupSourceFiles(manifestDir, [...updatedSources.keys()], "before");
  const manifestState: ManifestState = {
    status: "applying",
    sourceFiles,
    assets: validRenames.map((rename) => ({
      originalUrl: rename.originalUrl,
      newUrl: buildCloudinaryUrl(rename.parsed, rename.newPublicId),
      oldPublicId: rename.parsed.publicId,
      newPublicId: rename.newPublicId,
      status: "pending"
    }))
  };

  saveManifest(manifestDir, manifestState);
  console.log("\n[Apply] Manifest created at " + manifestDir);

  let hasError = false;
  for (let i = 0; i < manifestState.assets.length; i++) {
    const asset = manifestState.assets[i];
    console.log("[Rename] " + asset.oldPublicId + " -> " + asset.newPublicId);

    try {
      const result = await cloudinary.uploader.rename(asset.oldPublicId, asset.newPublicId, {
        overwrite: false,
        invalidate: true
      });

      asset.status = "renamed";
      asset.secure_url = result.secure_url;
      saveManifest(manifestDir, manifestState);
      await delay(250);
    } catch (error: unknown) {
      const apiError = asCloudinaryApiError(error);
      console.error("[Error] Failed to rename " + asset.oldPublicId + ":", apiError.message ?? error);
      asset.status = "failed";
      hasError = true;
      manifestState.status = "partial";
      saveManifest(manifestDir, manifestState);
      break;
    }
  }

  if (hasError) {
    console.log("\n[Halted] Apply halted due to errors. Source files were not updated.");
    console.log(
      "To rollback, run: npm run cloudinary:blog-rollback -- --manifest " +
        path.join(manifestDir, "manifest.json")
    );
    process.exit(1);
  }

  console.log("\n[Success] All assets renamed on Cloudinary.");
  console.log("[Source] Updating " + updatedSources.size + " MDX file(s)...");

  try {
    for (const [sourceFile, source] of updatedSources) {
      fs.writeFileSync(sourceFile, source, "utf-8");
    }
    backupSourceFiles(manifestDir, [...updatedSources.keys()], "after");
    manifestState.status = "completed";
    saveManifest(manifestDir, manifestState);
  } catch (error) {
    manifestState.status = "partial";
    saveManifest(manifestDir, manifestState);
    console.error("[Error] Failed to update MDX source:", error);
    console.log(
      "To rollback, run: npm run cloudinary:blog-rollback -- --manifest " +
        path.join(manifestDir, "manifest.json")
    );
    process.exit(1);
  }

  console.log("[Done] Process completed successfully.");
}

main().catch((error) => {
  console.error("Unhandled Error:", error);
  process.exit(1);
});
