import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HandmadePortfolioGallery } from "@/components/handmade/HandmadePortfolioGallery";
import { TrackedExternalLink } from "@/components/layout/TrackedExternalLink";
import { siteConfig } from "@/data/site";
import { customLeadTimeStatement } from "@/data/business-truth";
import { getHandmadePortfolio } from "@/lib/products/handmade-portfolio";
import styles from "./page.module.css";

const canonicalPath = "/do-moc-theo-yeu-cau";
const canonicalUrl = `${siteConfig.url}${canonicalPath}`;
const pageTitle = "Đồ Móc Theo Yêu Cầu Từ Ảnh Mẫu | Tiệm Len Nhà Tiny";
const pageDescription =
  "Gửi ảnh hoặc ý tưởng để Tiny tư vấn đồ móc theo yêu cầu. Xem các mẫu Tiny đã làm, quy trình trao đổi và những yếu tố dùng để báo giá.";
const consultationMessage =
  "Chào Tiny, mình muốn gửi ảnh mẫu để được tư vấn đồ móc theo yêu cầu.";
const messengerConsultUrl = `${siteConfig.messengerUrl}?text=${encodeURIComponent(consultationMessage)}`;

const faqItems = [
  {
    question: "Tiny có thể làm giống hoàn toàn ảnh mẫu không?",
    answer:
      "Ảnh mẫu được dùng làm định hướng. Tiny sẽ trao đổi trước về màu len, tỷ lệ và những chi tiết có thể thể hiện bằng kỹ thuật móc để hai bên cùng chốt phương án phù hợp."
  },
  {
    question: "Chưa có ảnh rõ thì có thể gửi ý tưởng không?",
    answer:
      "Có. Bạn có thể gửi ảnh tham khảo, bản phác thảo hoặc mô tả điều mình muốn. Càng có nhiều góc nhìn và chi tiết ưu tiên, Tiny càng dễ tư vấn sát ý tưởng."
  },
  {
    question: "Khi nào Tiny mới báo giá?",
    answer:
      "Tiny báo giá sau khi đã xem mẫu và trao đổi các yếu tố chính như kích thước, độ chi tiết, loại len, màu sắc, phụ kiện và số lượng."
  },
  {
    question: "Có thể thay đổi màu hoặc kích thước của mẫu đã làm không?",
    answer:
      "Có thể trao đổi để điều chỉnh theo nhu cầu. Tiny sẽ kiểm tra màu len và tính khả thi của từng chi tiết trước khi xác nhận."
  },
  {
    question: "Tiny có gửi ảnh thành phẩm trước khi giao không?",
    answer:
      "Có. Tiny chụp ảnh thành phẩm để bạn xem và xác nhận trước khi đóng gói, theo quy trình đặt đồ móc hiện tại của tiệm."
  }
] as const;

export const metadata: Metadata = {
  title: { absolute: pageTitle },
  description: pageDescription,
  alternates: { canonical: canonicalUrl },
  robots: { index: true, follow: true },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: canonicalUrl,
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    images: [
      {
        url: `${siteConfig.url}/images/crochet_products_800.jpg`,
        width: 800,
        height: 600,
        alt: "Các mẫu đồ móc theo yêu cầu do Tiệm Len Nhà Tiny thực hiện"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: [`${siteConfig.url}/images/crochet_products_800.jpg`]
  }
};

export default async function CustomCrochetPage() {
  const portfolio = await getHandmadePortfolio();
  const heroImages = portfolio.length > 0
    ? portfolio.slice(0, 3).map((item) => ({ src: item.image, alt: item.imageAlt, id: item.id }))
    : [{
        src: "/images/crochet_products_800.jpg",
        alt: "Đồ móc đặt riêng do Tiệm Len Nhà Tiny thực hiện",
        id: "handmade-hero"
      }];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Trang chủ", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "Đồ móc theo yêu cầu", item: canonicalUrl }
        ]
      },
      {
        "@type": "Service",
        name: "Dịch vụ đồ móc theo yêu cầu",
        description: pageDescription,
        url: canonicalUrl,
        provider: {
          "@type": "LocalBusiness",
          name: siteConfig.name,
          url: siteConfig.url,
          telephone: siteConfig.phone
        },
        areaServed: { "@type": "Country", name: "Việt Nam" }
      },
      {
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer }
        }))
      }
    ]
  };

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className={styles.hero} aria-labelledby="custom-crochet-title">
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <ol>
                <li><Link href="/">Trang chủ</Link></li>
                <li aria-current="page">Đồ móc theo yêu cầu</li>
              </ol>
            </nav>
            <p className={styles.eyebrow}>Được làm riêng tại Tiny</p>
            <h1 id="custom-crochet-title">Đồ móc theo yêu cầu từ ý tưởng của bạn</h1>
            <p className={styles.heroLead}>
              Gửi ảnh mẫu, Tiny sẽ cùng bạn chốt màu, kích thước và những chi tiết có thể thể hiện bằng len.
            </p>
            <div className={styles.heroActions}>
              <TrackedExternalLink
                href={messengerConsultUrl}
                className={styles.primaryButton}
                trackKey="product_messenger_click"
                label="Gửi mẫu cho Tiny"
              >
                Gửi mẫu cho Tiny
              </TrackedExternalLink>
              <a className={styles.secondaryButton} href="#mau-tiny-da-lam">
                Xem mẫu Tiny đã làm
              </a>
            </div>
            <p className={styles.heroNote}>Mỗi yêu cầu được trao đổi riêng trước khi Tiny xác nhận thực hiện.</p>
          </div>

          <div className={styles.heroCollage} aria-label="Một số mẫu Tiny đã thực hiện">
            {heroImages.map((image, index) => (
              <figure className={styles.heroImage} key={image.id}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 767px) 90vw, (max-width: 1100px) 45vw, 28vw"
                />
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.gallerySection} id="mau-tiny-da-lam" aria-labelledby="portfolio-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Portfolio thật từ Tiny</p>
          <h2 id="portfolio-title">Những mẫu Tiny đã làm</h2>
          <p>
            Dùng tìm kiếm hoặc bộ lọc để xem nhanh. Mỗi ảnh là một gợi ý để bạn bắt đầu trao đổi mẫu riêng.
          </p>
        </div>
        <HandmadePortfolioGallery items={portfolio} />
      </section>

      <section className={styles.ideaSection} aria-labelledby="idea-title">
        <div className={styles.ideaPanel}>
          <div>
            <p className={styles.eyebrow}>Không cần chọn đúng mẫu có sẵn</p>
            <h2 id="idea-title">Chưa thấy đúng mẫu bạn muốn?</h2>
            <p>Bạn chỉ cần gửi những gì đang có. Tiny sẽ hỏi thêm để hiểu điều quan trọng nhất trong ý tưởng.</p>
          </div>
          <ul>
            <li>Ảnh mẫu hoặc ảnh tham khảo ở nhiều góc nếu có</li>
            <li>Kích thước, màu sắc và số lượng mong muốn</li>
            <li>Chi tiết cần giữ lại hoặc muốn điều chỉnh</li>
            <li>Dịp sử dụng để Tiny hiểu tinh thần của món đồ</li>
          </ul>
          <TrackedExternalLink
            href={messengerConsultUrl}
            className={styles.primaryButton}
            trackKey="product_messenger_click"
            label="Gửi ý tưởng cho Tiny"
          >
            Gửi ý tưởng cho Tiny
          </TrackedExternalLink>
        </div>
      </section>

      <section className={styles.processSection} aria-labelledby="process-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Từng bước rõ ràng</p>
          <h2 id="process-title">Quy trình đặt đồ móc theo yêu cầu</h2>
          <p>Tiny trao đổi đủ thông tin trước khi bắt đầu để mẫu làm ra bám sát điều hai bên đã chốt.</p>
        </div>
        <ol className={styles.processList}>
          <li>
            <span>01</span>
            <div><h3>Gửi mẫu và mô tả</h3><p>Gửi ảnh, kích thước, màu sắc, số lượng và các chi tiết bạn ưu tiên.</p></div>
          </li>
          <li>
            <span>02</span>
            <div><h3>Tiny xem độ khả thi</h3><p>Tiny tư vấn chất liệu, tỷ lệ và cách thể hiện phù hợp với kỹ thuật móc.</p></div>
          </li>
          <li>
            <span>03</span>
            <div><h3>Chốt mẫu và báo giá</h3><p>Hai bên xác nhận yêu cầu, chi phí và lịch dự kiến trước khi thực hiện.</p></div>
          </li>
          <li>
            <span>04</span>
            <div><h3>Tiny thực hiện</h3><p>Mẫu được móc, ráp và hoàn thiện thủ công theo nội dung đã thống nhất.</p></div>
          </li>
          <li>
            <span>05</span>
            <div><h3>Xem ảnh và xác nhận</h3><p>Tiny gửi ảnh thành phẩm để bạn kiểm tra trước khi đóng gói và giao.</p></div>
          </li>
        </ol>
      </section>

      <section className={styles.quoteSection} aria-labelledby="quote-title">
        <div className={styles.quoteGrid}>
          <div>
            <p className={styles.eyebrow}>Báo giá theo từng yêu cầu</p>
            <h2 id="quote-title">Điều gì ảnh hưởng đến chi phí?</h2>
            <p>
              Đồ móc làm riêng không có một mức giá cố định. Tiny cần xem đủ thông tin trước khi gửi báo giá cụ thể.
            </p>
          </div>
          <ul className={styles.factorList}>
            <li><strong>Kích thước</strong><span>Mẫu lớn cần nhiều nguyên liệu và công đoạn hơn.</span></li>
            <li><strong>Độ chi tiết</strong><span>Trang phục, biểu cảm và chi tiết nhỏ làm thay đổi mức độ thực hiện.</span></li>
            <li><strong>Chất liệu</strong><span>Loại len, màu len, bông nhồi và phụ kiện được chọn theo mẫu.</span></li>
            <li><strong>Số lượng</strong><span>Tiny cần kiểm tra khả năng chuẩn bị nguyên liệu và thực hiện.</span></li>
            <li><strong>Lịch cần nhận</strong><span>{customLeadTimeStatement}</span></li>
          </ul>
        </div>
      </section>

      <aside className={styles.handmadeNote} aria-labelledby="handmade-note-title">
        <div>
          <p className={styles.eyebrow}>Một lưu ý nhỏ</p>
          <h2 id="handmade-note-title">Ảnh tham khảo là điểm bắt đầu</h2>
          <p>
            Với ảnh chụp, bản vẽ hoặc ảnh tạo bằng AI, Tiny sẽ trao đổi những phần có thể chuyển thành len. Thành phẩm thủ công có thể chênh nhẹ về màu và tỷ lệ do màn hình, lô len và thao tác bằng tay.
          </p>
        </div>
      </aside>

      <section className={styles.faqSection} aria-labelledby="faq-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Giải đáp trước khi gửi mẫu</p>
          <h2 id="faq-title">Câu hỏi thường gặp</h2>
        </div>
        <div className={styles.faqList}>
          {faqItems.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.finalCta} aria-labelledby="final-cta-title">
        <div>
          <p className={styles.eyebrow}>Bắt đầu từ một tấm ảnh</p>
          <h2 id="final-cta-title">Gửi ý tưởng, Tiny sẽ cùng bạn làm rõ phần còn lại</h2>
          <p>Chưa cần biết chính xác loại len hay kỹ thuật. Hãy gửi mẫu và điều bạn muốn giữ lại.</p>
          <div className={styles.finalActions}>
            <TrackedExternalLink
              href={messengerConsultUrl}
              className={styles.primaryButton}
              trackKey="product_messenger_click"
              label="Gửi mẫu qua Messenger"
            >
              Gửi mẫu qua Messenger
            </TrackedExternalLink>
            <TrackedExternalLink
              href={siteConfig.zaloUrl}
              className={styles.secondaryButton}
              trackKey="contact_zalo_click"
              label="Nhắn Zalo cho Tiny"
            >
              Nhắn Zalo cho Tiny
            </TrackedExternalLink>
          </div>
        </div>
      </section>
    </main>
  );
}
