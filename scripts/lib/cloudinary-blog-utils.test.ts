import assert from "node:assert";
import test from "node:test";
import { parseCloudinaryUrl, buildCloudinaryUrl } from "./cloudinary-blog-utils";

test("Cloudinary URL Parser", async (t) => {
  const cloudName = "djn2kd2hh";

  await t.test("Basic URL", () => {
    const url = "https://res.cloudinary.com/djn2kd2hh/image/upload/v12345/example.png";
    const parsed = parseCloudinaryUrl(url, cloudName);
    assert(parsed !== null);
    assert.strictEqual(parsed.publicId, "example");
    assert.strictEqual(parsed.version, "v12345/");
    assert.strictEqual(parsed.transformations, "");
    assert.strictEqual(parsed.extension, ".png");
  });

  await t.test("URL without version", () => {
    const url = "https://res.cloudinary.com/djn2kd2hh/image/upload/example.png";
    const parsed = parseCloudinaryUrl(url, cloudName);
    assert(parsed !== null);
    assert.strictEqual(parsed.publicId, "example");
    assert.strictEqual(parsed.version, "");
  });

  await t.test("URL with transformations", () => {
    const url = "https://res.cloudinary.com/djn2kd2hh/image/upload/c_fill,w_800/v12345/example.png";
    const parsed = parseCloudinaryUrl(url, cloudName);
    assert(parsed !== null);
    assert.strictEqual(parsed.publicId, "example");
    assert.strictEqual(parsed.transformations, "c_fill,w_800/");
    assert.strictEqual(parsed.version, "v12345/");
  });

  await t.test("URL with folders", () => {
    const url = "https://res.cloudinary.com/djn2kd2hh/image/upload/folder/subfolder/example.png";
    const parsed = parseCloudinaryUrl(url, cloudName);
    assert(parsed !== null);
    assert.strictEqual(parsed.publicId, "folder/subfolder/example");
    assert.strictEqual(parsed.version, "");
  });

  await t.test("URL with query params", () => {
    const url = "https://res.cloudinary.com/djn2kd2hh/image/upload/v12345/example.png?v=1";
    const parsed = parseCloudinaryUrl(url, cloudName);
    assert(parsed !== null);
    assert.strictEqual(parsed.publicId, "example");
    assert.strictEqual(parsed.queryParams, "?v=1");
  });

  await t.test("Different cloud name", () => {
    const url = "https://res.cloudinary.com/othercloud/image/upload/v12345/example.png";
    const parsed = parseCloudinaryUrl(url, cloudName);
    assert.strictEqual(parsed, null);
  });

  await t.test("Malformed URL", () => {
    const url = "https://res.cloudinary.com/djn2kd2hh/invalid/upload/v12345/example.png";
    const parsed = parseCloudinaryUrl(url, cloudName);
    assert.strictEqual(parsed, null);
  });
});
