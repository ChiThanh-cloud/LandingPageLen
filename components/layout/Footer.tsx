import Image from "next/image";
import Link from "next/link";
import { PolicyLinks } from "./PolicyLinks";
import { TrackedExternalLink } from "./TrackedExternalLink";
import { siteConfig } from "@/data/site";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Image
            src="/images/logo_160.png"
            alt="Logo Tiệm Len Nhà Tiny - len sợi và đồ móc handmade"
            className="logo-img footer-logo"
            width={160}
            height={160}
          />
          <p className="footer-slogan">&quot;Từng sợi len, một tình yêu&quot;</p>
          <address className="footer-contact-info">
            <p className="footer-entity">Chủ thể bán hàng: Tiệm Len Nhà Tiny</p>
            <p className="footer-addr">{siteConfig.address}</p>
            <p className="footer-hours">
              Giờ mở cửa: <time dateTime={`Mo-Su ${siteConfig.businessHoursOpens}-${siteConfig.businessHoursCloses}`}>{siteConfig.businessHours}</time>
            </p>
            <p className="footer-hours">Hotline/Zalo: {siteConfig.phoneDisplayDotted}</p>
          </address>
        </div>
        <nav className="footer-links" aria-label="Điều hướng footer">
          <Link href="/#ve-tiny">Về Tiny</Link>
          <Link href="/#bo-suu-tap">Bộ sưu tập</Link>
          <Link href="/#quy-trinh-dat-hang">Cách đặt hàng</Link>
          <Link href="/#khach-chia-se">Khách chia sẻ</Link>
          <Link href="/#lien-he-tu-van">Liên hệ tư vấn</Link>
          <Link href="/blog">Blog chart len</Link>
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
          <PolicyLinks />
        </nav>
        <p className="footer-copy">© 2026 Tiệm Len Nhà Tiny. Handmade with care.</p>
      </div>
    </footer>
  );
}

