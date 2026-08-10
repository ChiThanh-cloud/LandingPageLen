import type { YarnProduct } from "@/types/yarn-product";

export function ProductSeoContent({ product }: { product: YarnProduct }) {
  return <section className="yp-seo-content"><article><h2>{product.shortName} phù hợp móc gì?</h2><p>Chất sợi {product.material.toLowerCase()} phù hợp với thú bông, hoa len, túi nhỏ và phụ kiện. Cỡ kim {product.hookSize} giúp mũi móc đều và thành phẩm giữ form tốt.</p></article><article><h2>Cách chọn và phối màu len</h2><p>Chọn một màu chính, một màu sáng hơn cho chi tiết và một màu tương phản cho điểm nhấn. Nếu làm theo ảnh mẫu, bạn có thể nhắn Tiny để được đối chiếu màu trước khi đặt.</p></article><article><h2>Bảo quản len chưa sử dụng</h2><p>Để len nơi khô thoáng, tránh nắng trực tiếp và giữ nhãn cuộn để mua bổ sung đúng dòng. Phần sợi đang dùng nên cho vào túi sạch để hạn chế bụi và rối.</p></article></section>;
}
