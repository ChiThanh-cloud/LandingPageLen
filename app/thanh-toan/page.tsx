import type { Metadata } from "next";
import { CheckoutPage } from "@/components/checkout/CheckoutPage";
import { getAllSellableProducts } from "@/lib/products/commerce-products";

export const metadata: Metadata = {
  title: "Thanh toán",
  description: "Nhập thông tin giao hàng cho len sợi và phụ kiện đã chọn tại Tiệm Len Nhà Tiny.",
  robots: { index: false, follow: true }
};

export const revalidate = 300;

export default async function Page() {
  // The public sellable catalog is currently small, so the Server Component loads it once.
  // CheckoutPage accepts any relevant product subset, allowing an ID-based query later as data grows.
  const availableProducts = await getAllSellableProducts();
  return <CheckoutPage availableProducts={availableProducts} />;
}
