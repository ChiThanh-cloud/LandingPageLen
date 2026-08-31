export interface VariantsOnlyRawImageAttributes {
  dataZoomImage: string | null;
  dataImage: string | null;
  dataSrc: string | null;
  dataOriginal: string | null;
  dataLazySrc: string | null;
  dataSrcset: string | null;
  srcset: string | null;
  src: string | null;
}

export interface RawVariantSwatch {
  inputValue: string | null;
  labelText: string | null;
  elementText: string | null;
  image: VariantsOnlyRawImageAttributes | null;
  fallbackImageValues: Array<string | null>;
}

export interface VariantsOnlyPreviewItem {
  position: number;
  code: string;
  image: string;
  issue: "missing-code" | "missing-image" | "duplicate-code" | null;
}

export interface VariantsOnlyVariant {
  position: number;
  code: string;
  sourceImage: string;
  localImage: string;
  cloudinaryPublicId: string;
}

export interface VariantsOnlyPlan {
  items: VariantsOnlyPreviewItem[];
  validVariants: VariantsOnlyVariant[];
  duplicateCodes: string[];
  missingCodeCount: number;
  missingImageCount: number;
  duplicatedImages: Array<{ image: string; codes: string[] }>;
}

export interface VariantsOnlyImportPayload {
  name: string;
  color_code: string;
  image_url: string;
  full_image_url: string;
  sort_order: number;
}

export interface VariantsOnlyImportResult {
  productId: number | string;
  targetSlug: string;
  importedCount: number;
  insertedCount: number;
  updatedCount: number;
  variantCount: number;
}

const SKIPPED_IMAGE_SCHEMES = ["data:", "blob:", "javascript:"];

function isSkippedImageScheme(value: string) {
  const normalized = value.trim().toLowerCase();
  return SKIPPED_IMAGE_SCHEMES.some((scheme) => normalized.startsWith(scheme));
}

function normalizeImageUrl(rawValue: string | null | undefined, sourcePageUrl: string) {
  const raw = rawValue?.trim();
  if (!raw || isSkippedImageScheme(raw)) return null;

  try {
    if (raw.startsWith("//")) return `https:${raw}`;
    const parsed = raw.startsWith("https://") || raw.startsWith("http://")
      ? new URL(raw)
      : new URL(raw, sourcePageUrl);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch {
    return null;
  }
}

function removeBizwebThumbnailTransform(value: string) {
  try {
    const parsed = new URL(value);
    if (parsed.hostname === "bizweb.dktcdn.net") {
      parsed.pathname = parsed.pathname.replace(/^\/thumb\/[^/]+\//, "/");
    }
    return parsed.href;
  } catch {
    return value;
  }
}

function parseSrcset(rawSrcset: string) {
  return rawSrcset
    .trim()
    .split(/\s*,\s*(?=(?:https?:|\/\/|\/|data:|blob:|javascript:))/i)
    .map((part, index) => {
      const match = part.trim().match(/^(.*?)(?:\s+(\d+(?:\.\d+)?)(w|x))?$/i);
      const rawUrl = match?.[1]?.trim() || "";
      const amount = match?.[2] ? Number(match[2]) : index + 1;
      const unit = match?.[3]?.toLowerCase();
      return { rawUrl, score: unit === "x" ? amount * 1_000_000 : amount };
    })
    .filter((candidate) => candidate.rawUrl)
    .sort((a, b) => b.score - a.score);
}

function selectImageUrl(image: VariantsOnlyRawImageAttributes | null, sourcePageUrl: string) {
  if (!image) return null;

  for (const rawValue of [
    image.dataZoomImage,
    image.dataImage,
    image.dataSrc,
    image.dataOriginal,
    image.dataLazySrc,
  ]) {
    const normalized = normalizeImageUrl(rawValue, sourcePageUrl);
    if (normalized) return removeBizwebThumbnailTransform(normalized);
  }

  for (const rawSrcset of [image.dataSrcset, image.srcset]) {
    if (!rawSrcset) continue;
    for (const candidate of parseSrcset(rawSrcset)) {
      const normalized = normalizeImageUrl(candidate.rawUrl, sourcePageUrl);
      if (normalized) return removeBizwebThumbnailTransform(normalized);
    }
  }

  const normalizedSrc = normalizeImageUrl(image.src, sourcePageUrl);
  return normalizedSrc ? removeBizwebThumbnailTransform(normalizedSrc) : null;
}

function imageFromSwatch(swatch: RawVariantSwatch, sourcePageUrl: string) {
  const nestedImage = selectImageUrl(swatch.image, sourcePageUrl);
  if (nestedImage && !nestedImage.includes("no-image")) return nestedImage;

  for (const rawValue of swatch.fallbackImageValues) {
    const normalized = normalizeImageUrl(rawValue, sourcePageUrl);
    if (normalized && !normalized.includes("no-image")) {
      return removeBizwebThumbnailTransform(normalized);
    }
  }

  return "";
}

function safePathPart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "variant";
}

export function normalizeTargetSlug(value: string) {
  const slug = value.trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("--target-slug must be a lowercase Tiny product slug.");
  }
  return slug;
}

export function buildVariantsOnlyPlan(
  swatches: RawVariantSwatch[],
  sourcePageUrl: string,
  targetSlug: string,
): VariantsOnlyPlan {
  const slug = normalizeTargetSlug(targetSlug);
  const preliminary = swatches.map((swatch, index) => ({
    position: index + 1,
    code: (swatch.inputValue || swatch.labelText || swatch.elementText || "")
      .replace(/\n/g, "")
      .trim(),
    image: imageFromSwatch(swatch, sourcePageUrl),
  }));

  const codeCounts = new Map<string, number>();
  for (const item of preliminary) {
    if (item.code) codeCounts.set(item.code, (codeCounts.get(item.code) || 0) + 1);
  }
  const duplicateCodes = [...codeCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([code]) => code);
  const duplicateCodeSet = new Set(duplicateCodes);

  const items: VariantsOnlyPreviewItem[] = preliminary.map((item) => ({
    ...item,
    issue: !item.code
      ? "missing-code"
      : duplicateCodeSet.has(item.code)
        ? "duplicate-code"
        : !item.image
          ? "missing-image"
          : null,
  }));

  const validVariants = items
    .filter((item) => item.issue === null)
    .map((item) => {
      const paddedPosition = String(item.position).padStart(3, "0");
      const safeCode = safePathPart(item.code);
      return {
        position: item.position,
        code: item.code,
        sourceImage: item.image,
        localImage: `data/products/${slug}/images/${paddedPosition}-${safeCode}.webp`,
        cloudinaryPublicId: `lentiny/products/${slug}/${paddedPosition}-${safeCode}`,
      };
    });

  const imageCodes = new Map<string, string[]>();
  for (const item of items) {
    if (!item.code || !item.image) continue;
    const codes = imageCodes.get(item.image) || [];
    codes.push(item.code);
    imageCodes.set(item.image, codes);
  }

  return {
    items,
    validVariants,
    duplicateCodes,
    missingCodeCount: items.filter((item) => item.issue === "missing-code").length,
    missingImageCount: items.filter((item) => item.issue === "missing-image").length,
    duplicatedImages: [...imageCodes.entries()]
      .filter(([, codes]) => codes.length > 1)
      .map(([image, codes]) => ({ image, codes })),
  };
}

export function buildVariantsOnlyImportPayload(
  variants: VariantsOnlyVariant[],
  uploadedImages: Map<string, string>,
) {
  return variants.map<VariantsOnlyImportPayload>((variant) => {
    const imageUrl = uploadedImages.get(variant.code);
    if (!imageUrl) throw new Error(`Missing uploaded image for variant ${variant.code}.`);
    return {
      name: variant.code,
      color_code: variant.code,
      image_url: imageUrl,
      full_image_url: imageUrl,
      sort_order: variant.position,
    };
  });
}

export async function executeVariantsOnlyPlan(
  plan: VariantsOnlyPlan,
  mode: "dry-run" | "import",
  effects: {
    processImage: (variant: VariantsOnlyVariant) => Promise<string>;
    importBatch: (payload: VariantsOnlyImportPayload[]) => Promise<VariantsOnlyImportResult>;
  },
) {
  if (mode === "dry-run") return null;
  if (plan.duplicateCodes.length > 0) {
    throw new Error(`Duplicate color codes: ${plan.duplicateCodes.join(", ")}.`);
  }
  if (plan.validVariants.length === 0) {
    throw new Error("No valid variants with directly mapped images were found.");
  }

  const uploadedImages = new Map<string, string>();
  for (const variant of plan.validVariants) {
    uploadedImages.set(variant.code, await effects.processImage(variant));
  }
  return effects.importBatch(buildVariantsOnlyImportPayload(plan.validVariants, uploadedImages));
}

export function isVariantsOnlyImportResult(value: unknown): value is VariantsOnlyImportResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  return (typeof result.productId === "number" || typeof result.productId === "string")
    && typeof result.targetSlug === "string"
    && typeof result.importedCount === "number"
    && typeof result.insertedCount === "number"
    && typeof result.updatedCount === "number"
    && typeof result.variantCount === "number";
}

export function isSupportedImageBuffer(buffer: Buffer) {
  if (buffer.length < 12) return false;
  const header = buffer.subarray(0, 16);
  const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isPng = header.subarray(0, 8).equals(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  );
  const isGif = header.subarray(0, 6).toString("ascii") === "GIF87a"
    || header.subarray(0, 6).toString("ascii") === "GIF89a";
  const isWebp = header.subarray(0, 4).toString("ascii") === "RIFF"
    && header.subarray(8, 12).toString("ascii") === "WEBP";
  const isAvif = header.subarray(4, 12).toString("ascii").includes("ftypavif");
  return isJpeg || isPng || isGif || isWebp || isAvif;
}
