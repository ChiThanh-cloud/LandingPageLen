/* eslint-disable @next/next/no-img-element */

import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { HomepageEffects } from "@/components/home/HomepageEffects";
import { ProductShowcase } from "@/components/home/ProductShowcase";

const messengerConsultUrl =
  "https://m.me/61559447375156?text=Ch%C3%A0o%20Tiny%2C%20m%C3%ACnh%20mu%E1%BB%91n%20t%C6%B0%20v%E1%BA%A5n%20%C4%91%E1%BA%B7t%20len%2F%C4%91%E1%BB%93%20m%C3%B3c%20handmade.%20M%C3%ACnh%20c%C3%B3%20th%E1%BB%83%20g%E1%BB%ADi%20%E1%BA%A3nh%20m%E1%BA%ABu%20%C4%91%E1%BB%83%20Tiny%20b%C3%A1o%20gi%C3%A1%20gi%C3%BAp%20m%C3%ACnh%20kh%C3%B4ng%3F";

export const metadata: Metadata = {
  metadataBase: new URL("https://lentiny.xyz"),
  title: "Tiệm Len Nhà Tiny | Shop len handmade, set tự móc & quà tặng tại TP.HCM",
  description:
    "Tiệm Len Nhà Tiny là shop len handmade tại TP.HCM, nhận tư vấn cuộn len, set tự móc, đồ móc theo yêu cầu và quà tặng handmade. Nhắn Messenger để được Tiny tư vấn mẫu, màu len và báo giá nhanh.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Tiệm Len Nhà Tiny | Len handmade & đồ móc theo yêu cầu",
    description:
      "Shop len handmade tại TP.HCM: cuộn len, set tự móc, quà tặng và đồ móc theo yêu cầu. Nhắn Messenger để Tiny tư vấn mẫu và báo giá.",
    type: "website",
    url: "/",
    siteName: "Tiệm Len Nhà Tiny",
    locale: "vi_VN",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 675,
        alt: "Tiệm Len Nhà Tiny handmade, len sợi, túi len, thú bông len và phụ kiện"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Tiệm Len Nhà Tiny | Len handmade & đồ móc theo yêu cầu",
    description:
      "Shop len handmade tại TP.HCM: cuộn len, set tự móc, quà tặng và đồ móc theo yêu cầu. Nhắn Messenger để Tiny tư vấn mẫu và báo giá.",
    images: ["/images/og-image.jpg"]
  }
};

const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://lentiny.xyz/#business",
      name: "Tiệm Len Nhà Tiny",
      url: "https://lentiny.xyz/",
      logo: "https://lentiny.xyz/images/logo.png",
      image: "https://lentiny.xyz/images/og-image.jpg",
      description:
        "Tiệm Len Nhà Tiny là shop len handmade tại TP.HCM, chuyên cuộn len, phụ kiện đan móc, đồ móc handmade theo yêu cầu, set tự móc và quà tặng handmade.",
      telephone: "+84368903519",
      priceRange: "8000 VND - 500000 VND",
      address: {
        "@type": "PostalAddress",
        streetAddress: "853 Ba Đình, Phường Chánh Hưng",
        addressLocality: "Thành phố Hồ Chí Minh",
        addressCountry: "VN"
      },
      areaServed: { "@type": "Country", name: "Việt Nam" },
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          opens: "08:00",
          closes: "21:00"
        }
      ],
      sameAs: ["https://m.me/61559447375156", "https://zalo.me/0368903519"],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        telephone: "+84368903519",
        availableLanguage: "Vietnamese",
        url: "https://m.me/61559447375156"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://lentiny.xyz/#website",
      url: "https://lentiny.xyz/",
      name: "Tiệm Len Nhà Tiny",
      publisher: { "@id": "https://lentiny.xyz/#business" },
      inLanguage: "vi-VN"
    },
    {
      "@type": "Store",
      "@id": "https://lentiny.xyz/#store",
      name: "Tiệm Len Nhà Tiny",
      alternateName: "Len Tiny",
      description:
        "Tiệm Len Nhà Tiny là shop len handmade chuyên bán cuộn len, set tự móc, túi móc handmade, thú len, đồ móc theo yêu cầu và quà tặng handmade.",
      url: "https://lentiny.xyz/",
      areaServed: "VN",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        availableLanguage: "Vietnamese"
      },
      sameAs: ["https://m.me/61559447375156", "https://zalo.me/0368903519"]
    },
    {
      "@type": "FAQPage",
      "@id": "https://lentiny.xyz/#cau-hoi-nhanh-tiny",
      mainEntity: [
        {
          "@type": "Question",
          name: "Tiệm Len Nhà Tiny bán gì?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Tiệm Len Nhà Tiny bán cuộn len, set tự móc, túi móc handmade, thú len, đồ móc theo yêu cầu và quà tặng handmade."
          }
        },
        {
          "@type": "Question",
          name: "Tiệm Len Nhà Tiny phù hợp với ai?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Shop phù hợp với người mới tập móc len, người muốn mua set len tự làm, khách tìm quà tặng handmade hoặc cần tư vấn phối màu len."
          }
        },
        {
          "@type": "Question",
          name: "Có thể đặt đồ móc theo yêu cầu không?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Có. Khách có thể nhắn Facebook Messenger hoặc Zalo để gửi mẫu, chọn màu và được tư vấn trước khi đặt hàng."
          }
        },
        {
          "@type": "Question",
          name: "Shop có giao hàng toàn quốc không?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Tiệm Len Nhà Tiny nhận đơn online và hỗ trợ giao hàng toàn quốc."
          }
        }
      ]
    }
  ]
};

const trustItems = [
  ["Nhận làm theo mẫu", "Gửi ảnh để tư vấn màu & size"],
  ["Gửi ảnh kiểm tra", "Xem sản phẩm trước khi giao"],
  ["Giao hàng toàn quốc", "Đóng gói kỹ, dễ làm quà tặng"],
  ["Tư vấn miễn phí", "Hỗ trợ qua Zalo & Messenger"]
];

const processSteps = [
  ["01", "Nhắn nhủ ý tưởng", "Kể Tiny nghe bạn muốn món đồ thế nào qua Zalo hoặc Facebook nhé."],
  ["02", "Chốt màu & Dáng", "Tiny sẽ gửi bảng màu len, tư vấn cách phối màu sao cho xinh nhất."],
  ["03", "Tỉ mỉ móc tay", "Tiny bắt tay vào làm và sẽ gửi ảnh cập nhật để bạn xem hình hài bé nó ra sao."],
  ["04", "Giao tới tận tay", "Đóng gói thơm tho, bọc hộp cẩn thận và ship bay thẳng đến nhà bạn!"]
];

const blogCards = [
  {
    href: "/blog/vi-sao-qua-len-handmade-duoc-yeu-thich",
    image: "/images/crochet_products_800.jpg",
    alt: "Đồ len handmade dễ thương dùng làm quà tặng",
    date: "2026-05-25",
    dateLabel: "25/05/2026",
    title: "Vì sao quà len handmade được yêu thích?",
    desc: "Gợi ý lý do món quà bằng len luôn có cảm giác riêng và dễ thương."
  },
  {
    href: "/blog/nguoi-moi-hoc-moc-len-nen-chon-loai-len-nao",
    image: "/images/yarn_collection_800.jpg",
    alt: "Các cuộn len nhiều màu cho người mới học móc",
    date: "2026-05-25",
    dateLabel: "25/05/2026",
    title: "Người mới học móc len nên chọn loại len nào?",
    desc: "So sánh milk cotton, len nhung, cotton và acrylic cho người mới."
  },
  {
    href: "/blog/moc-thu-len-theo-anh-mat-bao-lau",
    image: "/images/gift_set_800.jpg",
    alt: "Quà handmade bằng len đặt móc theo yêu cầu",
    date: "2026-05-26",
    dateLabel: "26/05/2026",
    title: "Móc thú len theo ảnh mất bao lâu?",
    desc: "Các yếu tố ảnh hưởng tới thời gian làm thú len custom theo ảnh."
  }
];

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m20 6-11 11-5-5" />
    </svg>
  );
}

function SimpleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <>
      <HomepageEffects />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />

      <section className="hero" id="hero">
        <div className="hero-video-wrap">
          <video autoPlay muted loop playsInline preload="none" id="heroVideo" poster="/images/yarn_hero_800.jpg">
            <source src="/images/hero_video.mp4" type="video/mp4" media="(min-width: 769px)" />
          </video>
          <div className="hero-mobile-bg" />
          <div className="hero-overlay" />
        </div>
        <div className="hero-content">
          <p className="hero-badge">
            <SimpleIcon />
            Nhận đặt theo yêu cầu qua Zalo &amp; Messenger
          </p>
          <h1 className="hero-title">
            Len sợi, phụ kiện &amp; đồ móc handmade <span className="highlight">theo yêu cầu</span>
          </h1>
          <p className="hero-subtitle">
            Gửi ảnh mẫu, Tiny tư vấn màu/size và báo giá nhanh. Nhận móc thú bông, hoa len, túi, set quà và giao toàn
            quốc.
          </p>
          <ul className="hero-benefits" aria-label="Lợi ích khi đặt hàng tại Tiny">
            <li><CheckIcon /> Làm theo ảnh mẫu</li>
            <li><CheckIcon /> Gửi ảnh kiểm tra trước khi giao</li>
            <li><CheckIcon /> Tư vấn miễn phí</li>
          </ul>
          <div className="hero-btns">
            <a href={messengerConsultUrl} target="_blank" rel="noopener" className="btn btn-primary" data-track="hero_messenger_click">
              Nhắn tư vấn mẫu ngay
            </a>
            <a href="#bo-suu-tap" className="btn btn-outline" data-track="hero_view_products_click">
              Xem mẫu đã làm
            </a>
          </div>
          <p className="hero-microcopy">
            Phản hồi nhanh trong giờ mở cửa. Có thể gửi ảnh mẫu để Tiny tư vấn trước khi chốt đơn.
          </p>
        </div>
        <div className="hero-scroll"><span /></div>
      </section>

      <section className="trust-bar">
        <div className="container trust-grid">
          {trustItems.map(([title, desc]) => (
            <div className="trust-item" key={title}>
              <span className="trust-icon"><SimpleIcon /></span>
              <div>
                <strong>{title}</strong>
                <p>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="about section" id="ve-tiny">
        <div className="container about-grid">
          <div className="about-img-wrap">
            <img src="/images/yarn_hero_800.jpg" alt="Không gian Tiệm Len Nhà Tiny với len sợi và đồ móc handmade tại TP.HCM" className="about-img" width="800" height="600" loading="lazy" decoding="async" />
            <div className="about-badge-card">
              <span className="badge-num">100+</span>
              <span className="badge-label">Khách hàng hài lòng</span>
            </div>
          </div>
          <div className="about-text">
            <p className="section-tag">Chút tâm tình từ Tiny</p>
            <h2 className="section-title">Nơi những cuộn len <span className="highlight">biết kể chuyện</span></h2>
            <p>Không chỉ là một trạm dừng chân mua bán len sợi, Tiny là góc nhỏ dành riêng cho những ai trân trọng đồ thủ công. Chúng mình tin rằng, mỗi cuộn len đều ẩn chứa một câu chuyện, và mỗi mũi móc đều mang theo một phần tâm huyết.</p>
            <p>Dù bạn đang tìm kiếm những cuộn len mềm mịn để tự đan chiếc khăn ấm, hay cần một em gấu bông &quot;độc bản&quot; để làm quà tặng – Tiny luôn ở đây, cẩn thận tỉ mỉ từng chút một để gửi đến bạn sản phẩm hoàn thiện nhất.</p>
            <ul className="about-list">
              <li>Len tuyển chọn kỹ lưỡng: Dòng len Milk, Cotton, len xù... an toàn cho cả em bé.</li>
              <li>Móc tay 100%: Nhận làm theo mẫu ảnh hoặc lên ý tưởng thiết kế riêng cho bạn.</li>
              <li>Trách nhiệm tới cùng: Luôn gửi ảnh kiểm tra trước khi giao, hỗ trợ sửa dáng nếu chưa ưng ý.</li>
            </ul>
            <a href="#lien-he-tu-van" className="btn btn-primary">Ghé tiệm trò chuyện</a>
          </div>
        </div>
      </section>

      <section className="products section" id="bo-suu-tap">
        <div className="container">
          <p className="section-tag center">Góc nhỏ của Tiny</p>
          <h2 className="section-title center">Tiny có thể làm gì <span className="highlight">giúp bạn?</span></h2>
          <p className="section-sub center">Từ nguyên liệu đan móc đến những món quà thành phẩm, tất cả đều sẵn sàng.</p>
          <ProductShowcase />
        </div>
      </section>

      <section className="process section" id="quy-trinh-dat-hang">
        <div className="container">
          <p className="section-tag center">Cách thức đặt hàng</p>
          <h2 className="section-title center">Hành trình làm ra <span className="highlight">món quà của bạn</span></h2>
          <div className="process-steps">
            {processSteps.map(([num, title, desc], index) => (
              <Fragment key={num}>
                <div className="step">
                  <div className="step-num">{num}</div>
                  <div className="step-icon" aria-hidden="true"><SimpleIcon /></div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
                {index < processSteps.length - 1 ? <div className="step-arrow">→</div> : null}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      <section className="reviews section" id="khach-chia-se">
        <div className="container">
          <p className="section-tag center">Khách nhà Tiny chia sẻ</p>
          <h2 className="section-title center">Những lời nhắn nhỏ <span className="highlight">sau khi nhận hàng</span></h2>
          <div className="reviews-grid">
            {[
              ["/images/feedback_1_700.jpg", "Feedback khách hàng sau khi nhận đồ móc handmade từ Tiệm Len Nhà Tiny", "Đồ móc handmade", "Khách nhắn lại sau khi nhận mẫu"],
              ["/images/feedback_2_700.jpg", "Feedback khách hàng sau khi mua hoa len và phụ kiện tại Tiệm Len Nhà Tiny", "Hoa Tặng Người Yêu", "Khách nhắn lại sau khi nhận hoa"],
              ["/images/feedback_3_700.jpg", "Feedback khách hàng sau khi nhận set quà handmade từ Tiệm Len Nhà Tiny", "Set quà handmade", "Gói quà chỉn chu, gửi ảnh trước khi giao"]
            ].map(([src, alt, meta, text], index) => (
              <figure className={`review-card feedback-card${index === 1 ? " featured-review" : ""}`} key={src}>
                <img src={src} alt={alt} width="700" height="560" loading="lazy" decoding="async" />
                <figcaption>
                  <span className="review-meta">{meta}</span>
                  <strong>{text}</strong>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="home-blog section" id="blog-noi-bat">
        <div className="container">
          <p className="section-tag center">Góc đọc nhanh</p>
          <h2 className="section-title center">Blog nổi bật từ <span className="highlight">LenTiny</span></h2>
          <p className="section-sub center">Một vài bài nhẹ nhàng giúp bạn chọn quà, chọn len và chăm món đồ handmade lâu đẹp hơn.</p>
          <div className="home-blog-grid">
            {blogCards.map((post) => (
              <article className="home-blog-card" key={post.href}>
                <Link className="home-blog-media" href={post.href}>
                  <img src={post.image} alt={post.alt} width="800" height="600" loading="lazy" decoding="async" />
                </Link>
                <div className="home-blog-body">
                  <p className="home-blog-meta"><time dateTime={post.date}>{post.dateLabel}</time></p>
                  <h3><Link href={post.href}>{post.title}</Link></h3>
                  <p>{post.desc}</p>
                  <Link className="home-blog-link" href={post.href}>Đọc bài →</Link>
                </div>
              </article>
            ))}
          </div>
          <div className="home-blog-actions">
            <Link href="/blog" className="btn btn-primary">Xem tất cả bài viết</Link>
          </div>
        </div>
      </section>

      <section className="contact section" id="lien-he-tu-van">
        <div className="container">
          <p className="section-tag center">Đặt hàng ngay hôm nay</p>
          <h2 className="section-title center">Liên hệ <span className="highlight">Tiệm Len Nhà Tiny</span></h2>
          <p className="section-sub center">Gửi ảnh mẫu hoặc mô tả món bạn muốn, Tiny sẽ tư vấn màu len và báo giá trước khi làm.</p>
          <div className="contact-cards">
            <a href="https://m.me/61559447375156" target="_blank" rel="noopener" className="contact-card" id="contact-fb" data-track="contact_facebook_click">
              <div className="contact-card-icon fb-icon"><SimpleIcon /></div>
              <div className="contact-card-info">
                <strong>Messenger</strong>
                <span>Nhắn tin trực tiếp qua Messenger</span>
                <em>Tiệm Len Nhà Tiny</em>
              </div>
              <span className="contact-arrow">→</span>
            </a>
            <a href="https://zalo.me/0368903519" target="_blank" rel="noopener" className="contact-card" id="contact-zalo" data-track="contact_zalo_click">
              <div className="contact-card-icon zalo-icon">
                <svg viewBox="0 0 48 48" width="32" height="32" aria-hidden="true">
                  <rect width="48" height="48" rx="10" fill="#0068FF" />
                  <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold" fontFamily="Arial, sans-serif">Za</text>
                </svg>
              </div>
              <div className="contact-card-info">
                <strong>Zalo</strong>
                <span>Nhắn tin hoặc gọi điện trực tiếp</span>
                <em>036.890.3519</em>
              </div>
              <span className="contact-arrow">→</span>
            </a>
          </div>
          <div className="contact-address">
            <svg className="address-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <p>853 Ba Đình, Phường Chánh Hưng, TP. Hồ Chí Minh</p>
          </div>
          <p className="contact-map-link">
            <a href="https://www.google.com/maps/search/?api=1&query=853%20Ba%20%C4%90%C3%ACnh%2C%20Ph%C6%B0%E1%BB%9Dng%20Ch%C3%A1nh%20H%C6%B0ng%2C%20TP.%20H%E1%BB%93%20Ch%C3%AD%20Minh" target="_blank" rel="noopener">
              Xem chỉ đường trên Google Maps
            </a>
          </p>
          <div className="contact-hours">
            <span className="hours-label">Giờ mở cửa</span>
            <p>08:00 - 21:00, mỗi ngày</p>
          </div>
          <div className="map-container">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.8665042831874!2d106.659918!3d10.7448!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752e5513ab4357%3A0xc3f5a2e582e2c8dc!2s853%20Ba%20%C4%90%C3%ACnh%2C%20Ph%C6%B0%E1%BB%9Dng%2010%2C%20Qu%E1%BA%ADn%208%2C%20H%E1%BB%93%20Ch%C3%AD%20Minh%2C%20Vietnam!5e0!3m2!1sen!2s!4v1715060000000!5m2!1sen!2s"
              title="Bản đồ Tiệm Len Nhà Tiny tại 853 Ba Đình, Phường Chánh Hưng, TP.HCM"
              width="100%"
              height="250"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      <section className="shop-info section" id="thong-tin-tiny">
        <div className="container shop-info-inner">
          <p className="section-tag center">Về Tiny</p>
          <h2 className="section-title center">Thông tin về <span className="highlight">Tiệm Len Nhà Tiny</span></h2>
          <p className="shop-info-lead">
            Tiệm Len Nhà Tiny là <strong>shop len handmade</strong> chuyên bán <strong>cuộn len</strong>, <strong>set tự móc</strong>, <strong>túi móc handmade</strong>, <strong>thú len</strong>, <strong>đồ móc theo yêu cầu</strong> và <strong>quà tặng handmade</strong>. Shop phù hợp cho người mới tập móc len, khách muốn mua set len tự làm hoặc cần đặt sản phẩm handmade theo sở thích.
          </p>
          <ul className="shop-info-list">
            <li><strong>Sản phẩm chính:</strong> cuộn len, set tự móc, túi móc handmade, thú len, đồ móc theo yêu cầu, quà tặng handmade.</li>
            <li><strong>Phạm vi phục vụ:</strong> nhận đơn online toàn quốc, tư vấn trước khi chốt đơn.</li>
            <li><strong>Kênh liên hệ chính:</strong> Facebook Messenger và Zalo của Tiệm Len Nhà Tiny.</li>
          </ul>
        </div>
      </section>

      <section className="shop-info-faq section" id="cau-hoi-nhanh-tiny" aria-label="Câu hỏi nhanh về Tiệm Len Nhà Tiny">
        <div className="container shop-info-inner">
          <h2 className="section-title center">Câu hỏi nhanh về <span className="highlight">Tiệm Len Nhà Tiny</span></h2>
          <div className="shop-info-faq-list">
            <details className="shop-info-faq-item">
              <summary>Tiệm Len Nhà Tiny bán gì?</summary>
              <p>Tiệm Len Nhà Tiny bán cuộn len, set tự móc, túi móc handmade, thú len, đồ móc theo yêu cầu và quà tặng handmade.</p>
            </details>
            <details className="shop-info-faq-item">
              <summary>Tiệm Len Nhà Tiny phù hợp với ai?</summary>
              <p>Shop phù hợp với người mới tập móc len, người muốn mua set len tự làm, khách tìm quà tặng handmade hoặc cần tư vấn phối màu len.</p>
            </details>
            <details className="shop-info-faq-item">
              <summary>Có thể đặt đồ móc theo yêu cầu không?</summary>
              <p>Có. Khách có thể nhắn Facebook Messenger hoặc Zalo để gửi mẫu, chọn màu và được tư vấn trước khi đặt hàng.</p>
            </details>
            <details className="shop-info-faq-item">
              <summary>Shop có giao hàng toàn quốc không?</summary>
              <p>Tiệm Len Nhà Tiny nhận đơn online và hỗ trợ giao hàng toàn quốc.</p>
            </details>
          </div>
        </div>
      </section>
    </>
  );
}
