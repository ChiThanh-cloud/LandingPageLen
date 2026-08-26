export type ProductRevalidationTarget = {
  slug?: string | null;
  category?: string | null;
};

function getStorefrontProductPaths({ slug, category }: ProductRevalidationTarget) {
  if (category === "yarn") {
    return [
      "/len-soi-va-phu-kien",
      "/len-soi",
      ...(slug ? [`/len-soi/${slug}`] : [])
    ];
  }

  if (category === "accessory") {
    return [
      "/len-soi-va-phu-kien",
      ...(slug ? [`/phu-kien/${slug}`] : [])
    ];
  }

  return [];
}

export function getProductRevalidationPaths(
  product: ProductRevalidationTarget,
  previousProduct?: ProductRevalidationTarget | null
) {
  const previousPaths = previousProduct && previousProduct.category !== product.category
    ? getStorefrontProductPaths(previousProduct)
    : [];

  return ["/admin/san-pham", ...new Set([
    ...getStorefrontProductPaths(product),
    ...previousPaths
  ])];
}
