import Link from "next/link";
import { getYarnProductSeoContent } from "@/lib/products/yarn-product-content";
import { getYarnProductVisibleColorCount } from "@/lib/products/yarn-product-seo";
import type { YarnProduct } from "@/types/yarn-product";

export function ProductSeoContent({ product }: { product: YarnProduct }) {
  const visibleColors = getYarnProductVisibleColorCount(product);
  const content = getYarnProductSeoContent(product);

  return (
    <section className="yp-seo-content" aria-label={`Thông tin chọn ${product.shortName}`}>
      <article>
        <h2>Bảng màu {product.shortName}</h2>
        <p>
          {visibleColors > 0
            ? `${visibleColors} mã màu đang hiển thị trên trang này. Chọn từng mã màu để xem ảnh, giá và tình trạng của chính mã đó trước khi thêm vào giỏ.`
            : "Bảng màu sẽ hiển thị khi sản phẩm có mã màu công khai."}
        </p>
      </article>

      <article>
        <h2>Thông số {product.shortName}</h2>
        <p>{content.summary}</p>
      </article>

      {content.hook ? (
        <article>
          <h2>{content.hook.heading}</h2>
          <p>{content.hook.text}</p>
        </article>
      ) : null}

      <article>
        <h2>Cách chọn {product.shortName} theo mẫu hoặc chart</h2>
        <p>{content.chartText}</p>
      </article>

      {content.comparison ? (
        <article>
          <h2>{content.comparison.heading}</h2>
          <p>
            <Link href={content.comparison.href}>{content.comparison.label}</Link>{" "}
            để {content.comparison.description?.toLocaleLowerCase("vi")}
          </p>
        </article>
      ) : null}

      <article>
        <h2>Bài viết hữu ích về {product.shortName}</h2>
        <ul className="yp-seo-links">
          {content.articles.map((article) => (
            <li key={article.href}>
              <Link href={article.href}>{article.label}</Link>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
