import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HomeBlogPreview } from "@/components/home/HomeBlogPreview";
import { HomeFaq } from "@/components/home/HomeFaq";
import { PolicyLinks } from "@/components/layout/PolicyLinks";
import { homeFaq, getHomeFaqSchemaEntities } from "@/data/home-faq";
import { policies, policyLinks } from "@/data/policies";
import { siteConfig } from "@/data/site";
import { getAllPostMetadata } from "@/lib/blog/get-all-posts";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("homepage blog preview uses the public MDX registry and never renders empty chrome", () => {
  const homepage = source("./page.tsx");
  const posts = getAllPostMetadata(new Date("2026-12-31T00:00:00+07:00")).slice(0, 3);
  const html = renderToStaticMarkup(createElement(HomeBlogPreview, {
    posts: posts.map((post) => ({ ...post, image: "/images/og-image.jpg" }))
  }));

  assert.match(homepage, /getAllPostMetadata\(\)\.slice\(0, 3\)/);
  assert.doesNotMatch(homepage, /from "@\/data\/posts"/);
  assert.equal(posts.length, 3);
  assert.match(html, /Blog nổi bật từ/);

  for (const post of posts) {
    assert.match(html, new RegExp(`/blog/${post.slug}`));
    assert.match(html, new RegExp(post.h1.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(html, new RegExp((post.excerpt || post.description).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.equal(renderToStaticMarkup(createElement(HomeBlogPreview, { posts: [] })), "");
});

test("homepage FAQ has at least five visible entries sourced by the same schema data", () => {
  const html = renderToStaticMarkup(createElement(HomeFaq));
  const schemaEntities = getHomeFaqSchemaEntities();

  assert.ok(homeFaq.length >= 5);
  assert.equal(schemaEntities.length, homeFaq.length);

  for (const [index, item] of homeFaq.entries()) {
    assert.match(html, new RegExp(item.question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(html, new RegExp(item.answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.equal(schemaEntities[index].name, item.question);
    assert.equal(schemaEntities[index].acceptedAnswer.text, item.answer);
  }
});

test("footer policy actions are crawlable links to dedicated policy routes", () => {
  const html = renderToStaticMarkup(createElement(PolicyLinks));

  for (const link of policyLinks) {
    assert.match(html, new RegExp(`href="/${policies[link.key].slug}"`));
    assert.match(html, new RegExp(link.label.replace("&", "&amp;").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("policy routes use the existing policy content with unique canonical URLs", () => {
  const routeCases = [
    ["privacy", "./chinh-sach-bao-mat/page.tsx"],
    ["terms", "./dieu-khoan-dich-vu/page.tsx"],
    ["shipping", "./van-chuyen/page.tsx"],
    ["refund", "./doi-tra-hoan-tien/page.tsx"]
  ] as const;

  const policyPage = source("../components/policies/PolicyPage.tsx");
  assert.match(policyPage, /<h1>\{policy\.title\}<\/h1>/);
  assert.match(policyPage, /href="\/#lien-he-tu-van"/);
  assert.match(policyPage, /href="\/"/);
  assert.match(policyPage, /const canonical = `\$\{siteConfig\.url\}\/\$\{policy\.slug\}`/);

  const titles = new Set(Object.values(policies).map((policy) => policy.title));
  const descriptions = new Set(Object.values(policies).map((policy) => policy.description));
  assert.equal(titles.size, policyLinks.length);
  assert.equal(descriptions.size, policyLinks.length);

  for (const [key, route] of routeCases) {
    const routeSource = source(route);
    const policy = policies[key];
    assert.match(routeSource, new RegExp(`createPolicyMetadata\\("${key}"\\)`));
    assert.match(routeSource, new RegExp(`policyKey="${key}"`));
    assert.match(`${siteConfig.url}/${policy.slug}`, new RegExp(`/${policy.slug}$`));
    assert.ok(policy.description);
    assert.ok(policy.sections.length > 0);
  }
});

test("custom not-found page retains noindex semantics and essential navigation", () => {
  const notFound = source("./not-found.tsx");

  assert.match(notFound, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
  assert.match(notFound, /href="\/"[^>]*>Trang chủ/);
  assert.match(notFound, /href="\/len-soi"[^>]*>Xem len sợi/);
  assert.match(notFound, /href="\/blog"[^>]*>Blog/);
});

test("homepage safety wording does not claim unverified suitability for babies", () => {
  const homepage = source("./page.tsx");
  assert.doesNotMatch(homepage, /an toàn cho cả em bé/i);
});
