export type YarnVariant = {
  id: string;
  colorCode: string;
  colorName: string;
  image: string;
  /** Public catalog price override. The order API still re-queries Supabase. */
  price?: number | null;
  stock: number | null;
};

export type WholesaleTier = {
  minQuantity: number;
  price: number;
  label: string;
};

export type YarnCategory =
  | "milk-cotton"
  | "len-nhung"
  | "len-cotton"
  | "len-baby"
  | "len-acrylic"
  | "len-dac-biet"
  | "phu-kien";

export type YarnProduct = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  category: YarnCategory;
  description: string;
  seoDescription: string;
  price: number;
  weight: string;
  material: string;
  hookSize: string;
  origin: string;
  image: string;
  images: string[];
  updatedAt: string;
  variants: YarnVariant[];
  wholesaleTiers: WholesaleTier[];
};

export type CartItem = {
  productId: string;
  variantId: string;
  quantity: number;
  slug: string;
  productName: string;
  variantName: string;
  colorCode: string;
  imageUrl: string;
  /** UI cache only. Checkout must query the trusted price again from Supabase. */
  displayPrice: number;
};
