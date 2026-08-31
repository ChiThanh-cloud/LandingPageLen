export const ADMIN_PRODUCT_CATEGORIES = [
  { value: "handmade", label: "Đồ móc" },
  { value: "yarn", label: "Len sợi" },
  { value: "accessory", label: "Phụ kiện" },
  { value: "set", label: "Set tự móc" },
  { value: "gift", label: "Quà tặng" }
] as const;

export const INVENTORY_CATEGORIES = [
  { value: "yarn", label: "Len sợi", description: "Quản lý tồn kho len theo màu", symbol: "L" },
  { value: "accessory", label: "Phụ kiện", description: "Kim móc và phụ kiện đan móc", symbol: "P" }
] as const;

export type AdminProductCategory = (typeof ADMIN_PRODUCT_CATEGORIES)[number]["value"];
export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number]["value"];
export type InventoryFilter = "all" | InventoryCategory | "unmanaged";

type Identifiable = {
  id: number | string;
};

export type OrganizableProduct = Identifiable & {
  name: string | null;
  slug?: string | null;
  category: string | null;
  sort_order: number | null;
};

export type OrganizableVariant = Identifiable & {
  product_id: number | string;
  name: string | null;
  sku: string | null;
  color_name: string | null;
  color_code: string | null;
  stock: number | null;
  sort_order: number | null;
};

export type InventoryCategoryCounts = Record<InventoryFilter, number>;
export type ProductCategoryCounts = Record<"all" | AdminProductCategory, number>;

const productCategoryValues = new Set<string>(ADMIN_PRODUCT_CATEGORIES.map(({ value }) => value));
const inventoryCategoryValues = new Set<string>(INVENTORY_CATEGORIES.map(({ value }) => value));

export function normalizeAdminSearch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function compareNullableSortOrder(left: number | null, right: number | null) {
  return (left ?? Number.MAX_SAFE_INTEGER) - (right ?? Number.MAX_SAFE_INTEGER);
}

function compareStableText(left: string | null | undefined, right: string | null | undefined) {
  return String(left || "").localeCompare(String(right || ""), "vi", {
    numeric: true,
    sensitivity: "base"
  });
}

function compareIds(left: number | string, right: number | string) {
  return String(left).localeCompare(String(right), "vi", { numeric: true, sensitivity: "base" });
}

function compareProducts(left: OrganizableProduct, right: OrganizableProduct) {
  return compareNullableSortOrder(left.sort_order, right.sort_order)
    || compareStableText(left.name, right.name)
    || compareIds(left.id, right.id);
}

function compareVariants(left: OrganizableVariant, right: OrganizableVariant) {
  return compareNullableSortOrder(left.sort_order, right.sort_order)
    || compareStableText(left.name || left.color_name || left.color_code || left.sku, right.name || right.color_name || right.color_code || right.sku)
    || compareIds(left.id, right.id);
}

export function getProductCategoryCounts(products: readonly OrganizableProduct[]): ProductCategoryCounts {
  const counts: ProductCategoryCounts = {
    all: 0,
    handmade: 0,
    yarn: 0,
    accessory: 0,
    set: 0,
    gift: 0
  };

  for (const product of products) {
    if (!product.category || !productCategoryValues.has(product.category)) continue;
    counts.all += 1;
    counts[product.category as AdminProductCategory] += 1;
  }

  return counts;
}

export function getProductCategoryGroups<T extends OrganizableProduct>(
  products: readonly T[],
  query: string,
  activeCategory: "all" | AdminProductCategory
) {
  const normalizedQuery = normalizeAdminSearch(query.trim());
  const filtered = products.filter((product) => {
    if (!product.category || !productCategoryValues.has(product.category)) return false;
    if (activeCategory !== "all" && product.category !== activeCategory) return false;
    if (!normalizedQuery) return true;
    return normalizeAdminSearch(`${product.name || ""} ${product.slug || ""}`).includes(normalizedQuery);
  });

  return ADMIN_PRODUCT_CATEGORIES.flatMap((definition) => {
    if (activeCategory !== "all" && definition.value !== activeCategory) return [];
    const categoryProducts = filtered.filter((product) => product.category === definition.value);
    return categoryProducts.length ? [{ ...definition, products: categoryProducts }] : [];
  });
}

export function getInventoryCategoryCounts(
  products: readonly OrganizableProduct[],
  variants: readonly OrganizableVariant[]
): InventoryCategoryCounts {
  const categoryByProductId = new Map(
    products
      .filter((product) => product.category && inventoryCategoryValues.has(product.category))
      .map((product) => [String(product.id), product.category as InventoryCategory])
  );
  const counts: InventoryCategoryCounts = { all: 0, yarn: 0, accessory: 0, unmanaged: 0 };

  for (const variant of variants) {
    const category = categoryByProductId.get(String(variant.product_id));
    if (!category) continue;
    counts.all += 1;
    counts[category] += 1;
    if (variant.stock === null) counts.unmanaged += 1;
  }

  return counts;
}

export function getInventoryCategoryGroups<P extends OrganizableProduct, V extends OrganizableVariant>(
  products: readonly P[],
  variants: readonly V[],
  query: string,
  activeFilter: InventoryFilter
) {
  const normalizedQuery = normalizeAdminSearch(query.trim());
  const productById = new Map(
    products
      .filter((product) => product.category && inventoryCategoryValues.has(product.category))
      .map((product) => [String(product.id), product])
  );
  const variantsByProductId = new Map<string, V[]>();

  for (const variant of variants) {
    const product = productById.get(String(variant.product_id));
    if (!product) continue;
    if (activeFilter === "unmanaged" && variant.stock !== null) continue;
    if (activeFilter !== "all" && activeFilter !== "unmanaged" && product.category !== activeFilter) continue;

    const searchText = normalizeAdminSearch([
      product.name,
      variant.name,
      variant.color_name,
      variant.color_code,
      variant.sku
    ].filter(Boolean).join(" "));
    if (normalizedQuery && !searchText.includes(normalizedQuery)) continue;

    const productId = String(variant.product_id);
    const groupedVariants = variantsByProductId.get(productId) || [];
    groupedVariants.push(variant);
    variantsByProductId.set(productId, groupedVariants);
  }

  return INVENTORY_CATEGORIES.flatMap((definition) => {
    const productGroups = [...products]
      .filter((product) => product.category === definition.value && variantsByProductId.has(String(product.id)))
      .sort(compareProducts)
      .map((product) => ({
        product,
        variants: [...(variantsByProductId.get(String(product.id)) || [])].sort(compareVariants)
      }));

    return productGroups.length ? [{ ...definition, productGroups }] : [];
  });
}
