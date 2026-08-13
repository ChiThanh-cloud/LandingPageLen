import assert from "node:assert/strict";
import test from "node:test";
import { v2 as cloudinary } from "cloudinary";
import {
  CloudinaryUploadConfigurationError,
  createAdminSignedUpload
} from "./admin-signed-upload";

const environmentKeys = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"] as const;

function withCloudinaryEnvironment(callback: () => void) {
  const previous = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]));
  process.env.CLOUDINARY_CLOUD_NAME = "tiny-cloud";
  process.env.CLOUDINARY_API_KEY = "test-api-key";
  process.env.CLOUDINARY_API_SECRET = "test-api-secret";
  try {
    callback();
  } finally {
    for (const key of environmentKeys) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("admin signed uploads use only server-owned product and variant parameters", () => {
  withCloudinaryEnvironment(() => {
    const timestamp = 1_762_000_000;
    const product = createAdminSignedUpload("product", () => timestamp);
    const variant = createAdminSignedUpload("variant", () => timestamp);

    assert.equal(product.uploadUrl, "https://api.cloudinary.com/v1_1/tiny-cloud/image/upload");
    assert.equal(product.folder, "tiny-products");
    assert.equal(variant.folder, "tiny-products/variants");
    assert.equal(product.allowedFormats, "jpg,jpeg,png,webp,avif");
    assert.equal(product.overwrite, false);
    assert.equal(product.apiKey, "test-api-key");
    assert.equal(
      product.signature,
      cloudinary.utils.api_sign_request({
        timestamp,
        folder: "tiny-products",
        allowed_formats: "jpg,jpeg,png,webp,avif",
        overwrite: false
      }, "test-api-secret")
    );
    assert.equal("apiSecret" in product, false);
    assert.doesNotMatch(JSON.stringify(product), /test-api-secret/);
  });
});

test("admin signed uploads fail closed when Cloudinary server configuration is absent", () => {
  const previous = process.env.CLOUDINARY_API_SECRET;
  delete process.env.CLOUDINARY_API_SECRET;
  try {
    assert.throws(() => createAdminSignedUpload("product"), CloudinaryUploadConfigurationError);
  } finally {
    if (previous === undefined) delete process.env.CLOUDINARY_API_SECRET;
    else process.env.CLOUDINARY_API_SECRET = previous;
  }
});
