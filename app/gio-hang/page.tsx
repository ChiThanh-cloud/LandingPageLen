import type { Metadata } from "next";
import { CartPage } from "@/components/cart/CartPage";
import { getAllYarnProducts } from "@/lib/products/supabase-products";

export const metadata: Metadata = {
  title: "Giỏ hàng",
  description: "Kiểm tra sản phẩm len sợi và mã màu đã chọn tại Tiệm Len Nhà Tiny.",
  robots: { index: false, follow: true }
};

export const revalidate = 300;

export default async function Page() {
  const products = await getAllYarnProducts();
  return <CartPage products={products} />;
}
