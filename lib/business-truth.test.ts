import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  customDepositStatement,
  customLeadTimeStatement,
  nationwideShippingStatement
} from "@/data/business-truth";
import { products } from "@/data/products";
import { siteConfig } from "@/data/site";
import { policies } from "@/js/policy-modal.js";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const customBlog = source("../content/blog/moc-thu-len-theo-anh-mat-bao-lau.mdx");
const graduationBlog = source("../content/blog/qua-tot-nghiep-handmade-y-nghia.mdx");
const handmadeValueBlog = source("../content/blog/vi-sao-qua-len-handmade-duoc-yeu-thich.mdx");
const customPage = source("../app/do-moc-theo-yeu-cau/page.tsx");
const homepage = source("../app/page.tsx");
const aboutPage = source("../app/about/page.tsx");
const llms = source("../public/llms.txt");

test("confirmed custom lead time replaces fixed public production windows", () => {
  const customProduct = products.find((product) => product.slug === "thu-len-theo-yeu-cau");
  const flowerProduct = products.find((product) => product.slug === "hoa-len-handmade");
  const publicClaims = [
    JSON.stringify(products),
    policies.terms,
    customBlog,
    graduationBlog,
    handmadeValueBlog,
    customPage,
    llms
  ].join("\n");

  assert.ok(customProduct?.faq.some((item) => item.answer === customLeadTimeStatement));
  assert.ok(flowerProduct?.faq.some((item) => item.answer === customLeadTimeStatement));
  assert.match(policies.terms, new RegExp(customLeadTimeStatement.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(publicClaims, /(?:3\s*[-–—]\s*7\s*ngày|5\s*[-–—]\s*7\s*ngày|1\s*[-–—]\s*2\s*tuần)/i);
});

test("confirmed custom deposit is exactly 50 percent wherever a rate is published", () => {
  const customProduct = products.find((product) => product.slug === "thu-len-theo-yeu-cau");
  const depositClaims = [JSON.stringify(customProduct), policies.terms, customBlog, graduationBlog, llms].join("\n");
  const publishedRates = [...depositClaims.matchAll(/cọc[^.\n]{0,80}?(\d+)\s*%/gi)]
    .map((match) => Number(match[1]));

  assert.match(policies.terms, new RegExp(customDepositStatement.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(depositClaims, /30\s*[-–—]\s*50\s*%/i);
  assert.ok(publishedRates.length >= 4);
  assert.ok(publishedRates.every((rate) => rate === 50));
});

test("shipping policy states nationwide delivery without unconfirmed providers or SLA", () => {
  assert.match(policies.shipping, new RegExp(nationwideShippingStatement.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(policies.shipping, /GHN|GHTK|J&amp;T|J&T/i);
  assert.doesNotMatch(policies.shipping, /1\s*[-–—]\s*3\s*ngày|2\s*[-–—]\s*5\s*ngày/i);
  assert.match(llms, /hỗ trợ giao hàng toàn quốc/);
});

test("official address and owner-confirmed trust claims remain intact", () => {
  const productsSource = source("../data/products.ts");

  assert.equal(siteConfig.address, "853 Ba Đình, Phường Chánh Hưng, TP. Hồ Chí Minh");
  assert.match(llms, /853 Ba Đình, Phường Chánh Hưng, TP\. Hồ Chí Minh/);
  assert.match(homepage, /100\+/);
  assert.match(aboutPage, />100%<\/span>/);
  assert.match(productsSource, /300\+ đơn custom/);
  assert.match(productsSource, /80% khách quay lại/);
});

test("generic public starting-price copy is derived instead of hard-coded", () => {
  const showcase = source("../components/home/ProductShowcase.tsx");
  const page = source("../app/page.tsx");

  assert.doesNotMatch(showcase, /Từ 8\.000đ/);
  assert.doesNotMatch(policies.terms, /Từ 8\.000đ|từ 8\.000đ/);
  assert.match(showcase, /minimumPublicPrice/);
  assert.match(page, /getMinimumPublicCommercePrice\(await getAllSellableProducts\(\)\)/);
});

test("unconfirmed return details and GEO coordinates are preserved for owner review", () => {
  assert.match(policies.refund, /trong vòng 48 giờ/);
  assert.match(policies.refund, /không nhận đổi trả vì đổi ý/);
  assert.match(policies.refund, /3-7 ngày làm việc/);
  assert.match(homepage, /latitude: 10\.7441/);
  assert.match(homepage, /longitude: 106\.6895/);
  assert.match(homepage, /!2d106\.659918!3d10\.7448/);
});
