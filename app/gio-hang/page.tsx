import type { Metadata } from "next";
import { CartPage } from "@/components/cart/CartPage";
import { getAllSellableProducts } from "@/lib/products/commerce-products";

export const metadata: Metadata = {
  title: "Giỏ hàng",
  description: "Kiểm tra len sợi, phụ kiện và lựa chọn đã thêm vào giỏ hàng tại Tiệm Len Nhà Tiny.",
  robots: { index: false, follow: true }
};

export const revalidate = 300;

export default async function Page() {
  const products = await getAllSellableProducts();
  return <CartPage products={products} />;
}
