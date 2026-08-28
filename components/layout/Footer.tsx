import Image from "next/image";
import Link from "next/link";
import { PolicyLinks } from "./PolicyLinks";
import { TrackedExternalLink } from "./TrackedExternalLink";
import { siteConfig } from "@/data/site";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid container">

        {/* CỘT 1 — Thông tin tiệm */}
        <div className="footer-col footer-col--brand">
          <Image
            src="/images/logo_160.png"
            alt="Logo Tiệm Len Nhà Tiny - len sợi và đồ móc handmade"
            className="footer-logo"
            width={96}
            height={96}
          />
          <p className="footer-slogan">&quot;Từng sợi len, một tình yêu&quot;</p>
          <address className="footer-address">
            <p>{siteConfig.address}</p>
            <p>
              Giờ mở cửa:{" "}
              <time dateTime={`Mo-Su ${siteConfig.businessHoursOpens}-${siteConfig.businessHoursCloses}`}>
                {siteConfig.businessHours}
              </time>
            </p>
            <p>Hotline/Zalo: {siteConfig.phoneDisplayDotted}</p>
          </address>
        </div>

        {/* CỘT 2 — Khám phá */}
        <div className="footer-col">
          <p className="footer-col-heading">Khám phá</p>
          <nav className="footer-col-links" aria-label="Khám phá">
            <Link href="/about">Về Tiny</Link>
            <Link href="/#bo-suu-tap">Bộ sưu tập</Link>
            <Link href="/len-soi">Len sợi &amp; bảng màu</Link>
            <Link href="/#quy-trinh-dat-hang">Cách đặt hàng</Link>
            <Link href="/#khach-chia-se">Khách chia sẻ</Link>
            <Link href="/blog">Blog chart len</Link>
          </nav>
        </div>

        {/* CỘT 3 — Hỗ trợ & Chính sách */}
        <div className="footer-col">
          <p className="footer-col-heading">Hỗ trợ & Chính sách</p>
          <nav className="footer-col-links" aria-label="Hỗ trợ và chính sách">
            <Link href="/#lien-he-tu-van">Liên hệ tư vấn</Link>
            <PolicyLinks />
          </nav>
        </div>

        {/* CỘT 4 — Kết nối & Thanh toán */}
        <div className="footer-col">
          <p className="footer-col-heading">Kết nối</p>
          <nav className="footer-col-links" aria-label="Kết nối mạng xã hội">
            <TrackedExternalLink
              href={siteConfig.facebookUrl}
              trackKey="contact_facebook_page_click"
              label="Facebook Fanpage Tiệm Len Nhà Tiny"
            >
              Facebook
            </TrackedExternalLink>
            <TrackedExternalLink
              href={siteConfig.messengerUrl}
              trackKey="contact_facebook_click"
              label="Nhắn tin Messenger Tiệm Len Nhà Tiny"
            >
              Messenger
            </TrackedExternalLink>
            <TrackedExternalLink href={siteConfig.zaloUrl} trackKey="contact_zalo_click" label="Zalo Tiệm Len Nhà Tiny">
              Zalo
            </TrackedExternalLink>
          </nav>

          {/* Thanh toán */}
          <section className="footer-payment" aria-label="Hình thức thanh toán">
            <p className="footer-payment-title">Hình thức thanh toán</p>
            <ul className="footer-payment-list">
              <li className="footer-payment-card">
                <svg aria-hidden="true" width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="10" width="28" height="20" rx="3" stroke="#7eaee8" strokeWidth="2" fill="none"/>
                  <circle cx="14" cy="20" r="5" fill="#7eaee8" opacity=".3"/>
                  <circle cx="22" cy="20" r="5" fill="#7eaee8" opacity=".6"/>
                  <path d="M13 22h10" stroke="#7eaee8" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>COD</span>
              </li>
              <li className="footer-payment-card">
                <svg aria-hidden="true" width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="8" width="30" height="20" rx="3" fill="none" stroke="#6ecf8f" strokeWidth="2"/>
                  <rect x="3" y="13" width="30" height="5" fill="#6ecf8f"/>
                  <rect x="7" y="22" width="8" height="2" rx="1" fill="#6ecf8f" opacity=".7"/>
                  <rect x="17" y="22" width="5" height="2" rx="1" fill="#6ecf8f" opacity=".7"/>
                </svg>
                <span>Chuyển khoản</span>
              </li>
            </ul>
          </section>
        </div>

      </div>

      {/* Copyright */}
      <div className="footer-copy container">
        <p>© 2026 Tiệm Len Nhà Tiny. Handmade with care.</p>
      </div>
    </footer>
  );
}
