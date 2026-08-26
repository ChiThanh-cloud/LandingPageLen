import type { AdminInventoryProduct, AdminInventoryVariant } from "@/lib/admin/admin-service";

type InventoryProductLabels = Pick<AdminInventoryProduct, "category" | "unit_label" | "option_label">;

export function getInventoryUnitLabel(product: InventoryProductLabels) {
  const label = product.unit_label?.trim();
  if (label) return label;
  return product.category === "yarn" ? "cuộn" : "sản phẩm";
}

export function getInventoryOptionLabel(product: InventoryProductLabels) {
  const label = product.option_label?.trim();
  if (label) return label;
  return product.category === "yarn" ? "Màu" : "Phân loại";
}

export function getInventoryVariantValue(product: Pick<AdminInventoryProduct, "category">, variant: Pick<AdminInventoryVariant, "name" | "color_code" | "color_name">) {
  if (product.category === "yarn") return variant.color_code || variant.color_name || variant.name || "—";
  return variant.name || "Mặc định";
}

export function getInventoryStockText(stock: number | null, unitLabel: string) {
  if (stock === null) return "Chưa quản lý";
  return `Tồn: ${stock.toLocaleString("vi-VN")} ${unitLabel}`;
}
