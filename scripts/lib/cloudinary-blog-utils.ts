import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export type CloudinaryApiError = {
  http_code?: number;
  error?: { http_code?: number };
  message?: string;
};

export function asCloudinaryApiError(error: unknown): CloudinaryApiError {
  return typeof error === "object" && error !== null ? (error as CloudinaryApiError) : {};
}

export function validateConfig(): CloudinaryConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName) throw new Error("Missing CLOUDINARY_CLOUD_NAME");
  if (!apiKey) throw new Error("Missing CLOUDINARY_API_KEY");
  if (!apiSecret) throw new Error("Missing CLOUDINARY_API_SECRET");

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
  });

  return { cloudName, apiKey, apiSecret };
}

export interface ParsedCloudinaryUrl {
  originalUrl: string;
  baseUrl: string; // e.g. https://res.cloudinary.com/djn2kd2hh/image/upload/
  transformations: string; // e.g. f_auto,q_auto,c_fill,w_800,h_1000/
  version: string; // e.g. v1783440313/
  publicId: string; // e.g. ok1ydpmrflcgekwgsyye
  extension: string; // e.g. .png
  queryParams: string; // e.g. ?v=1
}

// We will parse it manually for robustness.
export function parseCloudinaryUrl(url: string, targetCloudName: string): ParsedCloudinaryUrl | null {
  const prefixRegex = new RegExp(
    "^(https?:\\/\\/res\\.cloudinary\\.com/" +
      targetCloudName +
      "\\/(?:(?:image|video|raw)\\/(?:upload|fetch|private|authenticated)|images)\\/)"
  );
  const prefixMatch = url.match(prefixRegex);
  
  if (!prefixMatch) return null;

  const baseUrl = prefixMatch[1];
  const rest = url.slice(baseUrl.length);

  // Separate query params
  const [pathPart, queryParamsPart] = rest.split('?');
  const queryParams = queryParamsPart ? `?${queryParamsPart}` : "";

  // Find extension
  const extMatch = pathPart.match(/(\.[a-zA-Z0-9]+)$/);
  if (!extMatch) return null; // No extension? Invalid for our case.
  const extension = extMatch[1];
  const pathWithoutExt = pathPart.slice(0, -extension.length);

  // Extract version and transformations
  let transformations = "";
  let version = "";
  let publicId = pathWithoutExt;

  const versionMatch = pathWithoutExt.match(/(?:^|\/)(v\d+)\//);
  
  if (versionMatch) {
    const versionStr = versionMatch[1] + "/";
    const versionIndex = pathWithoutExt.indexOf(versionStr);
    transformations = pathWithoutExt.slice(0, versionIndex);
    version = versionStr;
    publicId = pathWithoutExt.slice(versionIndex + versionStr.length);
  } else {
    // If no version, check if the first segment is a transformation
    const segments = pathWithoutExt.split('/');
    if (segments.length > 1 && (segments[0].includes('_') && segments[0].includes(','))) {
      transformations = segments[0] + "/";
      publicId = segments.slice(1).join('/');
    }
  }

  return {
    originalUrl: url,
    baseUrl,
    transformations,
    version,
    publicId,
    extension,
    queryParams
  };
}

export function buildCloudinaryUrl(parsed: ParsedCloudinaryUrl, newPublicId: string): string {
  // We drop the version when building the new URL
  return `${parsed.baseUrl}${parsed.transformations}${newPublicId}${parsed.extension}${parsed.queryParams}`;
}

export async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ManifestState {
  status: "planned" | "applying" | "completed" | "partial" | "rolling-back" | "rolled-back" | "failed";
  sourceFiles?: string[];
  assets: Array<{
    originalUrl: string;
    newUrl: string;
    oldPublicId: string;
    newPublicId: string;
    status: "pending" | "renamed" | "rolled-back" | "failed";
    secure_url?: string;
  }>;
}

export function createManifestDir() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dirPath = path.join(process.cwd(), "manifests", "cloudinary-blog-assets", timestamp);
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

export function saveManifest(dirPath: string, state: ManifestState) {
  fs.writeFileSync(path.join(dirPath, "manifest.json"), JSON.stringify(state, null, 2), "utf-8");
}

export function backupSourceFile(dirPath: string, sourcePath: string, suffix: "before" | "after") {
  const dest = path.join(dirPath, `posts.${suffix}.ts`);
  fs.copyFileSync(sourcePath, dest);
}

export function backupSourceFiles(
  dirPath: string,
  sourcePaths: string[],
  suffix: "before" | "after"
) {
  const projectRoot = process.cwd();
  const backupRoot = path.join(dirPath, "source." + suffix);
  const sourceFiles: string[] = [];

  for (const sourcePath of sourcePaths) {
    const relativeSourcePath = path.relative(projectRoot, sourcePath);
    if (
      !relativeSourcePath ||
      relativeSourcePath.startsWith(".." + path.sep) ||
      path.isAbsolute(relativeSourcePath)
    ) {
      throw new Error("Source file must be inside the project: " + sourcePath);
    }

    const destination = path.join(backupRoot, relativeSourcePath);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(sourcePath, destination);
    sourceFiles.push(relativeSourcePath);
  }

  return sourceFiles;
}
