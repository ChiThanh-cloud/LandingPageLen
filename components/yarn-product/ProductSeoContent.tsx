import Link from "next/link";
import { getYarnProductVisibleColorCount } from "@/lib/products/yarn-product-seo";
import type { YarnProduct } from "@/types/yarn-product";

export function ProductSeoContent({ product }: { product: YarnProduct }) {
  const visibleColors = getYarnProductVisibleColorCount(product);
  return <section className="yp-seo-content"><article><h2>Bảng màu {product.shortName}</h2><p>{visibleColors > 0 ? `${visibleColors} mã màu đang hiển thị trên trang này. Chọn từng mã màu để xem ảnh và giá tương ứng trước khi thêm vào giỏ.` : "Bảng màu sẽ hiển thị khi sản phẩm có mã màu công khai."}</p></article><article><h2>Hướng dẫn chọn len</h2><p><Link href="/blog/nguoi-moi-hoc-moc-len-nen-chon-loai-len-nao">Đọc hướng dẫn chọn len cho người mới</Link> để đối chiếu khối lượng, độ dày sợi, thành phần và kim móc của các dòng len đang bán.</p></article></section>;
}
