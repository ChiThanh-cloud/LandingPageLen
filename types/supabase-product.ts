export type SupabaseProductRow = {
  id: number | string;
  name: string | null;
  slug: string | null;
  category: string | null;
  sub_category: string | null;
  description: string | null;
  cover_image: string | null;
  image_url: string | null;
  full_image_url: string | null;
  base_price: number | string | null;
  price: number | string | null;
  weight: string | null;
  yarn_size: string | null;
  material: string | null;
  knitting_needle: string | null;
  crochet_hook: string | null;
  origin: string | null;
  status: string | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export type SupabaseVariantRow = {
  id: number | string;
  product_id: number | string;
  sku: string | null;
  name: string | null;
  color_code: string | null;
  color_name: string | null;
  color_hex: string | null;
  image_url: string | null;
  full_image_url: string | null;
  price: number | string | null;
  stock: number | null;
  status: string | null;
  sort_order: number | null;
};

export type SupabaseWholesalePriceRow = {
  id: number | string;
  product_id: number | string;
  min_quantity: number;
  max_quantity: number | null;
  price: number | string;
  label: string | null;
  status: string | null;
  sort_order: number | null;
};
