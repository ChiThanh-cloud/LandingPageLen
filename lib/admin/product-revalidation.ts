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
      "/phu-kien",
      ...(slug ? [`/phu-kien/${slug}`] : [])
    ];
  }

  return [];
}

export function getProductRevalidationPaths(
  product: ProductRevalidationTarget,
  previousProduct?: ProductRevalidationTarget | null
) {
  const currentPaths = getStorefrontProductPaths(product);
  const previousPaths = previousProduct && previousProduct.category !== product.category
    ? getStorefrontProductPaths(previousProduct)
    : [];
  const publicPaths = [...new Set([...currentPaths, ...previousPaths])];

  return [
    "/admin/san-pham",
    "/gio-hang",
    "/thanh-toan",
    ...(publicPaths.length > 0 ? ["/"] : []),
    ...publicPaths,
    ...(publicPaths.length > 0 ? ["/sitemap.xml"] : [])
  ];
}
