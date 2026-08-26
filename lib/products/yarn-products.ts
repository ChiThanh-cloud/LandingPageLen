import type { YarnProduct } from "@/types/yarn-product";

export const yarnProducts: YarnProduct[] = [
  {
    id: "milk-bo", slug: "milk-bo", name: "Milk Bò", shortName: "Milk Bò", category: "milk-cotton",
    description: "Cuộn Milk Bò 50g ±2g, cỡ sợi 2.5mm, thành phần 80% Cotton + 20% Milk Protein.",
    seoDescription: "Cuộn Milk Bò 50g ±2g, cỡ sợi 2.5mm, thành phần 80% Cotton + 20% Milk Protein.",
    price: 7200, weight: "50g ±2g", yarnSize: "2.5mm", material: "80% Cotton + 20% Milk Protein", hookSize: "2.5–3mm",
    image: "/images/yarn_collection_800.jpg", images: ["/images/yarn_collection_800.jpg"], status: "available", updatedAt: "2026-08-11",
    variants: [], wholesaleTiers: []
  },
  {
    id: "nhung-dua", slug: "nhung-dua", name: "Nhung Đũa", shortName: "Nhung Đũa", category: "len-nhung",
    description: "Cuộn Nhung Đũa 100g ±10g, cỡ sợi 6mm, thành phần 100% Polyester.",
    seoDescription: "Cuộn Nhung Đũa 100g ±10g, cỡ sợi 6mm, thành phần 100% Polyester.",
    price: 17000, weight: "100g ±10g", yarnSize: "6mm", material: "100% Polyester", hookSize: "6–9mm",
    image: "/images/yarn_hero_800.jpg", images: ["/images/yarn_hero_800.jpg"], status: "available", updatedAt: "2026-08-11",
    variants: [], wholesaleTiers: []
  },
  {
    id: "nhung-gau", slug: "nhung-gau", name: "Nhung Gấu", shortName: "Nhung Gấu", category: "len-nhung",
    description: "Cuộn Nhung Gấu 50g ±2g, cỡ sợi 2.5mm, thành phần 100% Polyester.",
    seoDescription: "Cuộn Nhung Gấu 50g ±2g, cỡ sợi 2.5mm, thành phần 100% Polyester.",
    price: 17000, weight: "50g ±2g", yarnSize: "2.5mm", material: "100% Polyester", hookSize: "2.5–3mm",
    image: "/images/yarn_collection_800.jpg", images: ["/images/yarn_collection_800.jpg"], status: "available", updatedAt: "2026-08-11",
    variants: [], wholesaleTiers: []
  },
  {
    id: "mac-den", slug: "mac-den", name: "Milk Cotton Mác Đen 50g", shortName: "Milk Cotton Mác Đen 50g", category: "milk-cotton",
    description: "Cuộn Milk Cotton Mác Đen 50g, cỡ sợi 2mm, thành phần 80% Cotton + 20% Milk Protein.",
    seoDescription: "Cuộn Milk Cotton Mác Đen 50g, cỡ sợi 2mm, thành phần 80% Cotton + 20% Milk Protein.",
    price: 8000, weight: "50g ±2g", yarnSize: "2mm", material: "80% Cotton + 20% Milk Protein", hookSize: "2.5–3mm",
    image: "/images/yarn_hero_800.jpg", images: ["/images/yarn_hero_800.jpg"], status: "available", updatedAt: "2026-08-11",
    variants: [], wholesaleTiers: []
  }
];

export function getAllYarnProducts() { return yarnProducts; }
export function getYarnProductBySlug(slug: string) { return yarnProducts.find((product) => product.slug === slug); }
