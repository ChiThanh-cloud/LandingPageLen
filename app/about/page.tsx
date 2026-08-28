import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/data/site";
import "./about.css";

const aboutTitle = "Về Tiny & Tiệm Len Nhà Tiny | Câu Chuyện Đằng Sau Từng Mũi Móc";
const aboutDescription =
  "Tiny bắt đầu móc len từ người thân truyền lại, mở tiệm online từ 2023. Mỗi sản phẩm handmade đều được làm tỉ mỉ, chụp ảnh gửi khách xem trước khi giao.";
const canonical = `${siteConfig.url}/about`;
const image = `${siteConfig.url}/images/og-image.jpg`;

export const metadata: Metadata = {
  title: { absolute: aboutTitle },
  description: aboutDescription,
  alternates: { canonical },
  openGraph: {
    title: aboutTitle,
    description: aboutDescription,
    url: canonical,
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    images: [{ url: image, width: 1200, height: 630, alt: "Tiny và Tiệm Len Nhà Tiny" }]
  },
  twitter: {
    card: "summary_large_image",
    title: aboutTitle,
    description: aboutDescription,
    images: [image]
  }
};

const profileJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Trang chủ", item: siteConfig.url },
        { "@type": "ListItem", position: 2, name: "Về Tiny", item: canonical }
      ]
    },
    {
      "@type": "ProfilePage",
      "@id": `${canonical}#profile`,
      url: canonical,
      name: aboutTitle,
      inLanguage: siteConfig.language,
      mainEntity: {
        "@type": "Person",
        "@id": `${canonical}#person`,
        name: "Tiny",
        url: canonical,
        jobTitle: "Người thợ móc len handmade",
        description: aboutDescription,
        knowsAbout: [
          "Móc len handmade",
          "Len milk cotton",
          "Thú bông len",
          "Hoa len",
          "Túi len",
          "Quà tặng handmade"
        ],
        worksFor: {
          "@type": "Organization",
          "@id": `${siteConfig.url}/#business`,
          name: siteConfig.name,
          url: siteConfig.url
        }
      },
      about: {
        "@id": `${siteConfig.url}/#business`
      }
    }
  ]
};

const skills = [
  { icon: "🧶", label: "Thú bông & gấu len", desc: "Mũm mĩm, đáng yêu, làm quà tặng" },
  { icon: "🌸", label: "Hoa len & bó hoa", desc: "Bền đẹp, không phai tàn theo thời gian" },
  { icon: "👜", label: "Túi len & phụ kiện", desc: "Form đẹp, thực dụng, có phong cách" }
];

const values = [
  {
    icon: "📸",
    title: "Gửi ảnh trước khi giao",
    desc: "Mỗi đơn hàng đều được chụp ảnh thật, gửi bạn xem và duyệt trước khi đóng gói. Tiny không giao hàng mà khách chưa ưng."
  },
  {
    icon: "🎨",
    title: "Tư vấn màu & mẫu tận tình",
    desc: "Bạn không cần biết gì về len. Cứ kể Tiny nghe bạn muốn gì — Tiny sẽ gợi ý loại len, màu sắc và mẫu phù hợp nhất."
  },
  {
    icon: "✂️",
    title: "Làm tỉ mỉ từng mũi móc",
    desc: "Tiny tự tay móc từng sản phẩm, không thuê gia công. Mỗi mũi khâu đều được kiểm tra để thành phẩm đạt chuẩn trước khi đến tay bạn."
  },
  {
    icon: "📦",
    title: "Đóng gói thơm tho, dễ làm quà",
    desc: "Hộp quà được chuẩn bị kỹ, có thể ghi thiệp theo yêu cầu. Nhiều khách mua để tặng trực tiếp mà không cần gói thêm."
  }
];

export default function AboutPage() {
  return (
    <main className="about-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(profileJsonLd).replace(/</g, "\\u003c")
        }}
      />

      {/* Hero */}
      <section className="about-hero">
        <nav className="about-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Trang chủ</Link>
          <span aria-hidden="true">›</span>
          <span>Về Tiny</span>
        </nav>
        <div className="about-hero-inner">
          <div className="about-hero-text">
            <p className="about-eyebrow">Câu chuyện đằng sau từng mũi móc</p>
            <h1 className="about-h1">
              Xin chào, mình là&nbsp;<span className="about-name-highlight">Tiny</span> 👋
            </h1>
            <p className="about-lead">
              Mình học móc len từ gia đình — không qua trường lớp, chỉ bằng những buổi ngồi quan sát người thân đan những cuộn len đầu tiên. Từ đó mình bị cuốn vào cái cảm giác thấy một thứ gì đó hình thành dưới đôi tay của mình.
            </p>
            <p className="about-lead">
              Năm 2023, mình bắt đầu nhận đơn online và mở Tiệm Len Nhà Tiny — một góc nhỏ bán len sợi, đồ móc handmade và nhận làm theo yêu cầu. Đến nay mình vẫn tự tay làm từng sản phẩm, bên cạnh công việc hằng ngày.
            </p>
            <div className="about-hero-ctas">
              <a
                href={siteConfig.messengerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="about-btn-primary"
              >
                Nhắn Tiny ngay
              </a>
              <Link href="/" className="about-btn-soft">
                Xem sản phẩm
              </Link>
            </div>
          </div>
          <div className="about-hero-badge-wrap" aria-hidden="true">
            <div className="about-avatar-ring">
              <div className="about-avatar-inner">
                <span className="about-avatar-emoji">🧶</span>
              </div>
            </div>
            <div className="about-stat-card about-stat-card--1">
              <span className="about-stat-num">2023</span>
              <span className="about-stat-label">Mở tiệm</span>
            </div>
            <div className="about-stat-card about-stat-card--2">
              <span className="about-stat-num">100%</span>
              <span className="about-stat-label">Tự tay móc</span>
            </div>
          </div>
        </div>
      </section>

      {/* Chuyên môn */}
      <section className="about-skills-section">
        <div className="about-section-inner">
          <h2 className="about-section-title">Tiny làm tốt nhất những gì?</h2>
          <p className="about-section-sub">
            Sau hơn 2 năm nhận đơn, mình thấy mình làm vui nhất — và khách ưng nhất — ở ba nhóm sản phẩm này.
          </p>
          <div className="about-skills-grid">
            {skills.map((s) => (
              <div key={s.label} className="about-skill-card">
                <span className="about-skill-icon" aria-hidden="true">{s.icon}</span>
                <strong className="about-skill-name">{s.label}</strong>
                <p className="about-skill-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Giá trị */}
      <section className="about-values-section">
        <div className="about-section-inner">
          <h2 className="about-section-title">Điều Tiny cam kết với từng đơn hàng</h2>
          <div className="about-values-grid">
            {values.map((v) => (
              <div key={v.title} className="about-value-card">
                <span className="about-value-icon" aria-hidden="true">{v.icon}</span>
                <div>
                  <strong className="about-value-title">{v.title}</strong>
                  <p className="about-value-desc">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="about-story-section">
        <div className="about-section-inner about-story-inner">
          <div className="about-story-text">
            <h2 className="about-section-title">Tại sao lại là đồ len handmade?</h2>
            <p>
              Hồi mình còn nhỏ, những cuộn len trong nhà không phải để trưng bày — chúng là để làm ra thứ gì đó cho người mình thương. Một chiếc tất, một con búp bê nhỏ, một cái khăn mùa đông. Đơn giản vậy thôi, nhưng lại được giữ rất lâu.
            </p>
            <p>
              Mình tin rằng đồ handmade có một thứ mà hàng sản xuất hàng loạt không có được — đó là <em>dấu tay của người làm ra nó</em>. Mỗi mũi móc đều cần sự tập trung, kiên nhẫn và cả tình cảm. Người nhận quà sẽ cảm nhận được điều đó, dù họ không nói ra.
            </p>
            <p>
              Vì vậy mình không vội. Mình nhận đủ đơn để làm tốt, không nhận nhiều để làm ẩu.
            </p>
          </div>
          <aside className="about-story-quote" aria-label="Châm ngôn của Tiny">
            <blockquote>
              &ldquo;Mỗi mũi móc đều cần sự tập trung, kiên nhẫn và cả tình cảm.&rdquo;
            </blockquote>
            <cite>— Tiny, Tiệm Len Nhà Tiny</cite>
          </aside>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta-section">
        <div className="about-section-inner about-cta-inner">
          <h2 className="about-cta-title">Bạn muốn đặt một món đồ handmade riêng?</h2>
          <p className="about-cta-desc">
            Nhắn Tiny qua Messenger hoặc Zalo. Kể mình nghe bạn đang nghĩ đến món gì — Tiny sẽ gợi ý mẫu, màu và báo giá trước khi bắt tay vào làm.
          </p>
          <div className="about-cta-actions">
            <a
              href={siteConfig.messengerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="about-btn-primary"
            >
              Nhắn qua Messenger
            </a>
            <a
              href={siteConfig.zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="about-btn-soft"
            >
              Zalo {siteConfig.phoneDisplay}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
