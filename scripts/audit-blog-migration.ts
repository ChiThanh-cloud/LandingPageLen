import assert from "node:assert/strict";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { posts } from "../data/posts";
import { blogPostMetaSchema } from "../lib/blog/schema";
import type { BlogPost, BlogPostMeta, PostSection, RichText } from "../types/post";

const projectRoot = process.cwd();
const contentDir = path.join(projectRoot, "content", "blog");
const baselineFile = path.join(projectRoot, "docs", "blog-migration-baseline.json");

type Snapshot = {
  metadata: ReturnType<typeof metadataSnapshot>;
  internalLinks: string[];
};

function serializable<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function richTextLinks(content: RichText | undefined) {
  return (content || [])
    .filter((part): part is Extract<RichText[number], { type: "link" }> => typeof part !== "string")
    .map((part) => part.href)
    .filter((href) => href.startsWith("/"));
}

function sectionLinks(section: PostSection) {
  if (section.type === "paragraphs") {
    return section.paragraphs.flatMap(richTextLinks);
  }

  if (section.type === "subsections") {
    return section.subsections.flatMap((subsection) =>
      subsection.paragraphs.flatMap(richTextLinks)
    );
  }

  if (section.type === "list") {
    return richTextLinks(section.intro);
  }

  if (section.type === "related") {
    return section.links.map((link) => `/blog/${link.slug}`);
  }

  return [];
}

function legacyInternalLinks(post: BlogPost) {
  const links = post.sections.flatMap(sectionLinks);
  if (post.heroCta?.secondaryHref) links.push(post.heroCta.secondaryHref);
  return [...new Set(links)].sort();
}

function mdxInternalLinks(content: string, meta: BlogPostMeta) {
  const links = [
    ...content.matchAll(/\]\((\/[^)\s]+)\)/g),
    ...content.matchAll(/href=["'](\/[^"']+)["']/g)
  ].map((match) => match[1]);

  for (const match of content.matchAll(/slug:\s*["']([^"']+)["']/g)) {
    links.push(`/blog/${match[1]}`);
  }

  if (meta.heroCta?.secondaryHref) links.push(meta.heroCta.secondaryHref);
  return [...new Set(links)].sort();
}

function metadataSnapshot(post: BlogPostMeta) {
  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    ogTitle: post.ogTitle,
    ogDescription: post.ogDescription,
    category: post.category,
    tags: post.tags,
    searchText: post.searchText,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    author: post.author,
    eyebrow: post.eyebrow,
    breadcrumbLabel: post.breadcrumbLabel,
    h1: post.h1,
    lead: post.lead,
    excerpt: post.excerpt,
    image: post.image,
    imageAlt: post.imageAlt,
    ogImage: post.ogImage,
    heroCta: post.heroCta
  };
}

function legacySnapshots() {
  return Object.fromEntries(
    posts.map((post) => [
      post.slug,
      {
        metadata: metadataSnapshot(post),
        internalLinks: legacyInternalLinks(post)
      } satisfies Snapshot
    ])
  );
}

async function mdxSnapshots() {
  let files: string[] = [];

  try {
    files = (await readdir(contentDir)).filter((file) => file.endsWith(".mdx")).sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const snapshots = new Map<string, Snapshot>();

  for (const file of files) {
    const fileSlug = file.slice(0, -4);
    const source = await readFile(path.join(contentDir, file), "utf8");
    const parsed = matter(source);
    const meta = blogPostMetaSchema.parse(parsed.data);

    assert.equal(meta.slug, fileSlug, `${file}: frontmatter slug must match the filename`);
    assert.ok(!snapshots.has(meta.slug), `Duplicate MDX slug: ${meta.slug}`);
    snapshots.set(meta.slug, {
      metadata: metadataSnapshot(meta),
      internalLinks: mdxInternalLinks(parsed.content, meta)
    });
  }

  return snapshots;
}

async function writeBaseline() {
  await mkdir(path.dirname(baselineFile), { recursive: true });
  await writeFile(
    baselineFile,
    `${JSON.stringify(serializable(legacySnapshots()), null, 2)}\n`,
    "utf8"
  );
  console.log(`Wrote blog migration baseline for ${posts.length} post(s).`);
}

async function audit() {
  const baseline = JSON.parse(await readFile(baselineFile, "utf8")) as Record<string, Snapshot>;
  const mdx = await mdxSnapshots();
  const current = legacySnapshots();

  for (const [slug, snapshot] of mdx) {
    current[slug] = snapshot;
  }
  const normalizedCurrent = serializable(current);

  assert.deepEqual(
    Object.keys(normalizedCurrent).sort(),
    Object.keys(baseline).sort(),
    "The public blog slug set changed"
  );

  for (const slug of Object.keys(baseline)) {
    assert.deepEqual(
      normalizedCurrent[slug],
      baseline[slug],
      `SEO/content parity failed for ${slug}`
    );
  }

  console.log(
    `Blog migration audit passed: ${Object.keys(current).length} post(s), ${mdx.size} MDX override(s).`
  );
}

async function main() {
  if (process.argv.includes("--write-baseline")) {
    await writeBaseline();
  } else {
    await audit();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
