import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { siteConfig } from "@/data/site";
import { getAllPostMetadata } from "@/lib/blog/get-all-posts";
import { getPostStructuredData } from "./PostJsonLd";

test("blog posts identify the same Tiny Person entity as the About profile", () => {
  const post = getAllPostMetadata(new Date("2026-08-28T12:00:00+07:00"))[0];
  assert.ok(post);
  const data = getPostStructuredData(post);
  const posting = data["@graph"].find((entry) => entry["@type"] === "BlogPosting") as Record<string, unknown>;
  const author = posting.author as Record<string, unknown>;
  const aboutSource = readFileSync(new URL("../../app/about/page.tsx", import.meta.url), "utf8");

  assert.equal(author["@id"], `${siteConfig.url}/about#person`);
  assert.equal(author.url, `${siteConfig.url}/about`);
  assert.match(aboutSource, /`\$\{canonical\}#person`/);
  assert.doesNotMatch(JSON.stringify(data), /#author-tiny/);
});
