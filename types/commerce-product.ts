export type SellableCategory = "yarn" | "accessory";

export type CommerceVariant = {
  id: string;
  productId: string;
  name: string;
  sku: string | null;
  price: number | null;
  stock: number | null;
  status: string | null;
  sortOrder: number;
  image: string;
  colorCode: string | null;
  colorName: string | null;
  colorHex: string | null;
};

export type CommerceProduct = {
  id: string;
  name: string;
  slug: string;
  category: SellableCategory;
  subCategory: string | null;
  description: string;
  image: string;
  coverImage: string | null;
  price: number;
  unitLabel: string;
  optionLabel: string;
  status: string | null;
  sortOrder: number;
  updatedAt: string;
  variants: CommerceVariant[];
};
