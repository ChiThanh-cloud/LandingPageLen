import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createSignUploadHandler
} from "./route";
import { createAdminSignedUpload } from "@/lib/cloudinary/admin-signed-upload";

const environmentKeys = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"] as const;
const productManager = readFileSync(
  new URL("../../../../../components/admin/ProductManager.tsx", import.meta.url),
  "utf8"
);

function request(body: unknown) {
  return new Request("https://lentiny.xyz/api/admin/cloudinary/sign-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

function withCloudinaryEnvironment(callback: () => Promise<void>) {
  const previous = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]));
  process.env.CLOUDINARY_CLOUD_NAME = "tiny-cloud";
  process.env.CLOUDINARY_API_KEY = "test-api-key";
  process.env.CLOUDINARY_API_SECRET = "test-api-secret";
  return callback().finally(() => {
    for (const key of environmentKeys) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

test("unauthenticated callers cannot obtain an upload signature", async () => {
  let signerCalls = 0;
  const handler = createSignUploadHandler({
    async getVerifiedAdmin() {
      return null;
    },
    createSignedUpload() {
      signerCalls += 1;
      throw new Error("must not sign");
    }
  });
  const response = await handler(request({ target: "product" }));
  assert.equal(response.status, 401);
  assert.equal(signerCalls, 0);
});

test("signed upload route rejects invalid targets and extra request fields", async () => {
  let signerCalls = 0;
  const handler = createSignUploadHandler({
    async getVerifiedAdmin() {
      return { id: "admin-id", email: "admin@tiny.test" };
    },
    createSignedUpload(target) {
      signerCalls += 1;
      return createAdminSignedUpload(target, () => 1_762_000_000);
    }
  });

  for (const body of [{ target: "other" }, { target: "product", folder: "attacker-folder" }]) {
    const response = await handler(request(body));
    assert.equal(response.status, 400);
  }
  assert.equal(signerCalls, 0);
});

test("verified admins receive only the signed, server-owned upload response", async () => {
  await withCloudinaryEnvironment(async () => {
    const handler = createSignUploadHandler({
      async getVerifiedAdmin() {
        return { id: "admin-id", email: "admin@tiny.test" };
      },
      createSignedUpload(target) {
        return createAdminSignedUpload(target, () => 1_762_000_000);
      }
    });

    const response = await handler(request({ target: "variant" }));
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(body.folder, "tiny-products/variants");
    assert.equal(body.overwrite, false);
    assert.equal(body.allowedFormats, "jpg,jpeg,png,webp,avif");
    assert.match(body.uploadUrl, /\/image\/upload$/);
    assert.equal("apiSecret" in body, false);
    assert.doesNotMatch(JSON.stringify(body), /test-api-secret/);
  });
});

test("verified admins receive a generic unavailable response when Cloudinary is not configured", async () => {
  const previous = process.env.CLOUDINARY_API_SECRET;
  delete process.env.CLOUDINARY_API_SECRET;
  try {
    const handler = createSignUploadHandler({
      async getVerifiedAdmin() {
        return { id: "admin-id", email: "admin@tiny.test" };
      },
      createSignedUpload: createAdminSignedUpload
    });
    const response = await handler(request({ target: "product" }));
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.deepEqual(await response.json(), { ok: false });
  } finally {
    if (previous === undefined) delete process.env.CLOUDINARY_API_SECRET;
    else process.env.CLOUDINARY_API_SECRET = previous;
  }
});

test("unexpected signer failures return generic 503 and log only safe diagnostic metadata", async () => {
  const logs: unknown[][] = [];
  const originalConsoleError = console.error;
  console.error = (...args) => {
    logs.push(args);
  };
  try {
    const handler = createSignUploadHandler({
      async getVerifiedAdmin() {
        return { id: "admin-id", email: "admin@tiny.test" };
      },
      createSignedUpload() {
        throw new Error("test-api-secret and upload signature must not be logged");
      }
    });
    const response = await handler(request({ target: "product" }));
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { ok: false });
    assert.deepEqual(logs, [["Cloudinary upload signing failed", { name: "Error" }]]);
    assert.doesNotMatch(JSON.stringify(logs), /test-api-secret|signature/);
  } finally {
    console.error = originalConsoleError;
  }
});

test("ProductManager contains only the signed upload client flow", () => {
  assert.doesNotMatch(productManager, /upload_preset|Unsigned upload preset|tiny_admin_cloudinary_config|localStorage/);
  assert.match(productManager, /\/api\/admin\/cloudinary\/sign-upload/);
  assert.match(productManager, /data\.append\("signature", signed\.signature\)/);
  assert.match(productManager, /data\.append\("api_key", signed\.apiKey\)/);
  assert.match(productManager, /data\.append\("timestamp", String\(signed\.timestamp\)\)/);
});
