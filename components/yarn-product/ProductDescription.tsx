import type { YarnProduct } from "@/types/yarn-product";

export function ProductDescription({ product }: { product: YarnProduct }) {
  const specs = [["Khối lượng", product.weight], ["Chất liệu", product.material], ["Cỡ kim gợi ý", product.hookSize], ["Xuất xứ", product.origin]];
  return <section className="yp-description"><div><h2>Thông tin sợi</h2><p>{product.description}</p></div><dl>{specs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>;
}
