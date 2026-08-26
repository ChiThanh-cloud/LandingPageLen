export type ProductFormLabels = {
  unitLabel: string;
  optionLabel: string;
};

type ProductLabelSource = {
  category: string | null;
  unit_label: string | null;
  option_label: string | null;
};

function savedLabel(value: string | null | undefined) {
  return value?.trim() || "";
}

/**
 * Category changes deliberately use fresh defaults. Persisted labels are only
 * restored when opening the existing product that owns them.
 */
export function getProductFormLabels(category: string, product?: ProductLabelSource | null): ProductFormLabels {
  const isCurrentProductCategory = product?.category === category;

  if (category === "yarn") {
    return {
      unitLabel: isCurrentProductCategory ? savedLabel(product?.unit_label) || "cuộn" : "cuộn",
      optionLabel: isCurrentProductCategory ? savedLabel(product?.option_label) || "Màu" : "Màu"
    };
  }

  if (category === "accessory" && isCurrentProductCategory) {
    return {
      unitLabel: savedLabel(product?.unit_label),
      optionLabel: savedLabel(product?.option_label)
    };
  }

  return { unitLabel: "", optionLabel: "" };
}
