import React from "react";
import Link from "next/link";
import { siteConfig } from "@/data/site";
import type { YarnProduct } from "@/types/yarn-product";

function productFacts(product: YarnProduct) {
  return [
    ["Khối lượng", product.weight],
    ["Độ dày sợi", product.yarnSize],
    ["Thành phần", product.material],
    ["Kim móc", product.hookSize]
  ].filter((fact): fact is [string, string] => Boolean(fact[1]?.trim()));
}

export function YarnCatalogSeoContent({ products }: { products: YarnProduct[] }) {
  if (products.length === 0) return null;

  const productsWithHooks = products.filter((product) => product.hookSize?.trim());

  return (
    <section className="yc-content" aria-label="Hướng dẫn chọn len và thông tin catalog">
      <section className="yc-content-section" aria-labelledby="yarn-types-heading">
        <div className="yc-content-heading">
          <p>Chọn theo thông số</p>
          <h2 id="yarn-types-heading">Các loại len sợi đang bán tại Tiny</h2>
          <p>
            Mỗi dòng len dưới đây lấy trực tiếp từ catalog đang hiển thị. Hãy mở trang chi tiết để xem bảng màu,
            giá và thông số của đúng sản phẩm trước khi thêm vào giỏ.
          </p>
        </div>
        <div className="yc-content-products">
          {products.map((product) => (
            <article key={product.id} className="yc-content-product">
              <h3><Link href={`/len-soi/${product.slug}`}>{product.name}</Link></h3>
              {product.description ? <p>{product.description}</p> : null}
              <dl>
                {productFacts(product).map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <Link href={`/len-soi/${product.slug}`} className="yc-content-link">
                Xem bảng màu, giá và thông số <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="yc-content-section yc-content-choice" aria-labelledby="yarn-choice-heading">
        <div className="yc-content-heading">
          <p>Đối chiếu với chart</p>
          <h2 id="yarn-choice-heading">Nên chọn loại len nào cho sản phẩm muốn móc?</h2>
        </div>
        <div className="yc-content-copy">
          <p>
            Với thú bông, hoa, túi hay phụ kiện, hãy bắt đầu từ chart hoặc mẫu bạn muốn làm thay vì đoán qua tên
            dòng len. Đọc yêu cầu về cỡ sợi, thành phần và kim móc, rồi so với thông số trên từng trang sản phẩm.
            Đây là cách thực tế nhất để biết một dòng len có khớp với mẫu hay không.
          </p>
          <p>Không nên thay trực tiếp một sợi có độ dày khác. Hãy móc thử bằng chính kim và dòng len đang cân nhắc trước khi mua đủ cho cả dự án.</p>
          <ul>
            <li><strong>Thú bông:</strong> đối chiếu cỡ sợi, cỡ kim và độ chặt mà chart yêu cầu; kiểm tra mẫu thử trước khi làm các phần chính.</li>
            <li><strong>Hoa:</strong> xem chart yêu cầu cỡ sợi và kim nào cho từng cánh hoặc lá, rồi đối chiếu với thông số sản phẩm.</li>
            <li><strong>Túi và phụ kiện:</strong> ưu tiên yêu cầu về kích thước, kiểu mũi và độ chặt của mẫu; không suy ra chỉ từ tên dòng len.</li>
          </ul>
        </div>
      </section>

      <section className="yc-content-section yc-content-hooks" aria-labelledby="yarn-hooks-heading">
        <div className="yc-content-heading">
          <p>Thông số đang công bố</p>
          <h2 id="yarn-hooks-heading">Chọn cỡ kim móc theo loại len</h2>
          <p>
            Các khoảng kim dưới đây lấy từ từng sản phẩm đang bán. Chúng là điểm bắt đầu để thử mẫu, không
            thay thế cỡ kim hoặc mật độ mũi được ghi trong chart.
          </p>
        </div>
        {productsWithHooks.length ? (
          <dl className="yc-hook-list">
            {productsWithHooks.map((product) => (
              <div key={product.id}>
                <dt><Link href={`/len-soi/${product.slug}`}>{product.name}</Link></dt>
                <dd>{product.hookSize}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <p className="yc-content-note">
          Nếu mũi quá chặt hoặc quá thoáng so với mẫu, hãy điều chỉnh từng nấc nhỏ và móc thử lại. Cùng một khoảng
          kim nhưng lực tay và kiểu mũi có thể tạo ra kết quả khác nhau.
        </p>
      </section>

      <section className="yc-content-section yc-content-price" aria-labelledby="yarn-price-heading">
        <div className="yc-content-heading">
          <p>Kiểm tra trước khi đặt</p>
          <h2 id="yarn-price-heading">Bảng màu và giá len</h2>
        </div>
        <div className="yc-content-copy">
          <p>
            Catalog giúp bạn so sánh các dòng len đang có; mỗi trang chi tiết có bảng màu và thông số riêng để bạn
            đối chiếu kỹ hơn. Khi đã chọn dòng len, mở sản phẩm, chọn mã màu đang hiển thị và kiểm tra giá trước khi
            thêm số lượng cần thiết vào giỏ.
          </p>
          <p>
            Giá và mã màu có thể khác theo từng sản phẩm, vì vậy trang chi tiết là nơi nên xem lần cuối trước khi
            đặt. Nếu cần phối nhiều màu hoặc chưa chắc số cuộn cho mẫu đang làm, gửi ảnh chart hoặc mẫu cho Tiny để
            được gợi ý dựa trên thông số đang có.
          </p>
        </div>
      </section>

      <section className="yc-content-section yc-content-faq" aria-labelledby="yarn-faq-heading">
        <div className="yc-content-heading">
          <p>Hỏi nhanh trước khi mua</p>
          <h2 id="yarn-faq-heading">Câu hỏi thường gặp khi chọn len</h2>
        </div>
        <dl>
          <div>
            <dt>Người mới nên chọn loại nào?</dt>
            <dd>Bắt đầu từ chart, rồi đối chiếu cỡ sợi và kim móc trên từng sản phẩm. Móc một mẫu thử nhỏ sẽ đáng tin hơn việc chọn chỉ theo tên dòng len.</dd>
          </div>
          <div>
            <dt>Xem bảng màu ở đâu?</dt>
            <dd>Mở trang chi tiết của dòng len bạn quan tâm. Các mã màu đang hiển thị tại đó để bạn chọn trước khi thêm vào giỏ.</dd>
          </div>
          <div>
            <dt>Chọn kim móc ra sao?</dt>
            <dd>Dùng khoảng kim ghi trên sản phẩm làm điểm bắt đầu, sau đó ưu tiên yêu cầu của chart và kết quả mẫu thử theo lực tay của bạn.</dd>
          </div>
          <div>
            <dt>Kiểm tra giá như thế nào?</dt>
            <dd>Xem giá trên trang sản phẩm sau khi đã đối chiếu dòng len và mã màu. Đây là cách chắc chắn nhất trước khi chọn số lượng.</dd>
          </div>
          <div>
            <dt>Chưa biết chọn sợi thì làm gì?</dt>
            <dd><a href={siteConfig.zaloUrl} target="_blank" rel="noopener noreferrer">Nhắn Tiny tư vấn</a> kèm ảnh chart hoặc mẫu muốn làm để được gợi ý cỡ sợi, kim móc và số cuộn cần kiểm tra.</dd>
          </div>
        </dl>
      </section>
    </section>
  );
}
