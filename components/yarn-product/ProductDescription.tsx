import type { YarnProduct } from "@/types/yarn-product";

export function ProductDescription({ product }: { product: YarnProduct }) {
  const specs = [
    ["Khối lượng", product.weight],
    ["Độ dày sợi", product.yarnSize],
    ["Thành phần", product.material],
    ["Kim móc khuyên dùng", product.hookSize],
    ...(product.origin?.trim() ? [["Xuất xứ", product.origin]] : [])
  ].filter((entry): entry is [string, string] => Boolean(entry[1]?.trim()));

  if (!product.description && specs.length === 0) return null;
  return <section className="yp-description"><div><h2>Thông số {product.shortName}</h2>{product.description ? <p>{product.description}</p> : null}</div>{specs.length ? <dl>{specs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : null}</section>;
}
