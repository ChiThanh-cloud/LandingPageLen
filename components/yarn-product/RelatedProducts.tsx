import Image from "next/image";
import Link from "next/link";
import { getYarnProductImageAlt } from "@/lib/products/yarn-product-seo";
import type { YarnProduct } from "@/types/yarn-product";

export function RelatedProducts({ products }: { products: YarnProduct[] }) {
  return <section className="yp-related"><h2>Loại len khác bạn có thể cần</h2><div className="yp-related-grid">{products.map((product) => <Link href={`/len-soi/${product.slug}`} key={product.id}><Image src={product.image} alt={getYarnProductImageAlt(product)} width={520} height={390} /><span>{product.name}</span><strong>{product.price.toLocaleString("vi-VN")}đ</strong></Link>)}</div></section>;
}
