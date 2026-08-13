import "server-only";

import { v2 as cloudinary } from "cloudinary";

export const ADMIN_UPLOAD_TARGETS = ["product", "variant"] as const;
export type AdminUploadTarget = (typeof ADMIN_UPLOAD_TARGETS)[number];

const allowedFormats = ["jpg", "jpeg", "png", "webp", "avif"] as const;
const folders: Record<AdminUploadTarget, string> = {
  product: "tiny-products",
  variant: "tiny-products/variants"
};

export class CloudinaryUploadConfigurationError extends Error {
  constructor() {
    super("Cloudinary upload configuration is unavailable");
  }
}

export type AdminSignedUpload = {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string;
  overwrite: false;
};

function requiredEnvironment(name: "CLOUDINARY_CLOUD_NAME" | "CLOUDINARY_API_KEY" | "CLOUDINARY_API_SECRET") {
  const value = process.env[name]?.trim();
  if (!value) throw new CloudinaryUploadConfigurationError();
  return value;
}

export function createAdminSignedUpload(
  target: AdminUploadTarget,
  now: () => number = () => Math.floor(Date.now() / 1000)
): AdminSignedUpload {
  const cloudName = requiredEnvironment("CLOUDINARY_CLOUD_NAME");
  const apiKey = requiredEnvironment("CLOUDINARY_API_KEY");
  const apiSecret = requiredEnvironment("CLOUDINARY_API_SECRET");
  const timestamp = now();
  const folder = folders[target];
  const allowedFormatsValue = allowedFormats.join(",");
  const parameters = {
    timestamp,
    folder,
    allowed_formats: allowedFormatsValue,
    overwrite: false
  };

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
    apiKey,
    timestamp,
    signature: cloudinary.utils.api_sign_request(parameters, apiSecret),
    folder,
    allowedFormats: allowedFormatsValue,
    overwrite: false
  };
}
