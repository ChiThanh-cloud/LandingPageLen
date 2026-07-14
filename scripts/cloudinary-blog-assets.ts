import fs from "fs";
import path from "path";
import { posts } from "../data/posts";
import { v2 as cloudinary } from "cloudinary";
import { 
  validateConfig, 
  parseCloudinaryUrl, 
  buildCloudinaryUrl, 
  delay, 
  createManifestDir, 
  saveManifest, 
  backupSourceFile, 
  ManifestState,
  asCloudinaryApiError
} from "./lib/cloudinary-blog-utils";

async function main() {
  const args = process.argv.slice(2);
  const isApply = args.includes("--apply");
  const isDryRun = !isApply || args.includes("--dry-run");

  const config = validateConfig();

  console.log(`[Preflight] Validating credentials for cloud: ${config.cloudName}`);
  try {
    await cloudinary.api.ping();
  } catch {
    console.error("Cloudinary ping failed! Invalid credentials.");
    process.exit(1);
  }

  const cloudName = config.cloudName;
  const renames: Array<{
    originalUrl: string;
    parsed: ReturnType<typeof parseCloudinaryUrl>;
    newPublicId: string;
  }> = [];

  // 1. Gather all URLs and map them
  for (const post of posts) {
    const slug = post.slug;
    
    // Helper to process an image url
    const processUrl = (url: string | undefined, name: string) => {
      if (!url) return;
      const parsed = parseCloudinaryUrl(url, cloudName);
      if (!parsed) return; // not our cloud or invalid url
      
      const newPublicId = `lentiny/blog/${slug}/${name}`;
      
      // If already correct, skip
      if (parsed.publicId === newPublicId) {
        return;
      }
      
      // Check for duplicates in our plan
      if (renames.find(r => r.newPublicId === newPublicId)) {
        throw new Error(`Duplicate target public ID detected in plan: ${newPublicId}`);
      }
      if (renames.find(r => r.parsed?.publicId === parsed.publicId)) {
        // If multiple posts share the exact same original image, this might happen. 
        // We'll rename it to the first post's slug and warn.
        console.warn(`[Warn] Asset ${parsed.publicId} is used multiple times. It will be renamed to the first assigned public ID.`);
        return; 
      }

      renames.push({
        originalUrl: url,
        parsed,
        newPublicId
      });
    };

    processUrl(post.image, "cover");
    
    if (post.ogImage && post.ogImage !== post.image) {
      processUrl(post.ogImage, "og-cover");
    }

    let imageCounter = 1;
    for (const section of post.sections || []) {
      if (section.type === "image") {
        const name = `image-${imageCounter.toString().padStart(2, "0")}`;
        processUrl(section.src, name);
        imageCounter++;
      }
    }
  }

  if (renames.length === 0) {
    console.log("No assets to rename. Everything is up to date!");
    process.exit(0);
  }

  console.log(`\n[Preflight] Found ${renames.length} assets to rename.`);

  console.log("[Preflight] Verifying source assets exist and targets are free...");
  const validRenames: typeof renames = [];

  for (const item of renames) {
    const { parsed, newPublicId } = item;
    
    let sourceExists = true;
    try {
      await cloudinary.api.resource(parsed!.publicId);
    } catch (error: unknown) {
      const apiError = asCloudinaryApiError(error);
      if (apiError.http_code === 404 || apiError.error?.http_code === 404) {
        // Automatically skip dead links by default to prevent blocking the rest of the batch
        console.warn(`[Preflight Warn] Asset not found ON CLOUDINARY (404): ${parsed!.publicId}.`);
        console.warn(`   -> The URL exists in code, but the image is deleted/missing from Cloudinary. Skipping it.`);
        sourceExists = false;
      } else {
        throw error;
      }
    }

    if (!sourceExists) continue;

    validRenames.push(item);

    try {
      await cloudinary.api.resource(newPublicId);
      console.error(`[Preflight Error] Target asset already exists: ${newPublicId}`);
      process.exit(1);
    } catch (error: unknown) {
      const apiError = asCloudinaryApiError(error);
      if (apiError.http_code !== 404 && apiError.error?.http_code !== 404) {
        throw error;
      }
      // 404 is expected for target!
    }
  }

  console.log("[Preflight] All checks passed.");

  if (isDryRun) {
    console.log("\n[Dry Run] Planned renames:");
    for (const item of validRenames) {
      console.log(`  ${item.parsed!.publicId} -> ${item.newPublicId}`);
    }
    console.log("\nRun with --apply to execute.");
    process.exit(0);
  }

  if (validRenames.length === 0) {
    console.log("No valid assets left to rename after filtering missing sources.");
    process.exit(0);
  }

  // 3. Setup Manifest
  const manifestDir = createManifestDir();
  const sourceFile = path.join(process.cwd(), "data", "posts.ts");
  backupSourceFile(manifestDir, sourceFile, "before");

  const manifestState: ManifestState = {
    status: "applying",
    assets: validRenames.map(r => ({
      originalUrl: r.originalUrl,
      newUrl: buildCloudinaryUrl(r.parsed!, r.newPublicId),
      oldPublicId: r.parsed!.publicId,
      newPublicId: r.newPublicId,
      status: "pending"
    }))
  };

  saveManifest(manifestDir, manifestState);
  console.log(`\n[Apply] Manifest created at ${manifestDir}`);

  // 4. Rename sequentially
  let hasError = false;
  for (let i = 0; i < manifestState.assets.length; i++) {
    const asset = manifestState.assets[i];
    console.log(`[Rename] ${asset.oldPublicId} -> ${asset.newPublicId}`);
    
    try {
      const result = await cloudinary.uploader.rename(asset.oldPublicId, asset.newPublicId, {
        overwrite: false,
        invalidate: true
      });
      
      asset.status = "renamed";
      asset.secure_url = result.secure_url; // capture actual url
      saveManifest(manifestDir, manifestState);
      
      await delay(250); // 200-300ms delay as requested
    } catch (error: unknown) {
      const apiError = asCloudinaryApiError(error);
      console.error(`[Error] Failed to rename ${asset.oldPublicId}:`, apiError.message ?? error);
      asset.status = "failed";
      hasError = true;
      manifestState.status = "partial";
      saveManifest(manifestDir, manifestState);
      break;
    }
  }

  // 5. Update source if successful
  if (hasError) {
    console.log(`\n[Halted] Apply halted due to errors. Source file not updated.`);
    console.log(`To rollback, run: npm run cloudinary:blog-rollback -- --manifest ${path.join(manifestDir, "manifest.json")}`);
    process.exit(1);
  }

  manifestState.status = "completed";
  saveManifest(manifestDir, manifestState);
  console.log("\n[Success] All assets renamed on Cloudinary.");

  console.log("[Source] Updating data/posts.ts...");
  let postsContent = fs.readFileSync(sourceFile, "utf-8");
  
  for (const asset of manifestState.assets) {
    // Only exact-replace the url
    postsContent = postsContent.split(asset.originalUrl).join(asset.newUrl);
  }

  fs.writeFileSync(sourceFile, postsContent, "utf-8");
  backupSourceFile(manifestDir, sourceFile, "after");

  console.log("[Done] Process completed successfully.");
}

main().catch(err => {
  console.error("Unhandled Error:", err);
  process.exit(1);
});
