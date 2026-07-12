import Image from "next/image";
import Link from "next/link";
import { PolicyLinks } from "./PolicyLinks";
import { TrackedExternalLink } from "./TrackedExternalLink";

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
          <p className="footer-entity">Chủ thể bán hàng: Tiệm Len Nhà Tiny</p>
          <p className="footer-addr">853 Ba Đình, Phường Chánh Hưng, TP.HCM</p>
          <p className="footer-hours">Giờ mở cửa: 08:00 - 21:00, mỗi ngày</p>
          <p className="footer-hours">Hotline/Zalo: 036.890.3519</p>
        </div>
        <div className="footer-links">
          <Link href="/#ve-tiny">Về Tiny</Link>
          <Link href="/#bo-suu-tap">Bộ sưu tập</Link>
          <Link href="/#quy-trinh-dat-hang">Cách đặt hàng</Link>
          <Link href="/#khach-chia-se">Khách chia sẻ</Link>
          <Link href="/#lien-he-tu-van">Liên hệ tư vấn</Link>
          <Link href="/blog">Blog chart len</Link>
          <TrackedExternalLink
            href="https://m.me/61559447375156"
            trackKey="contact_facebook_click"
            label="Messenger"
          >
            Messenger
          </TrackedExternalLink>
          <TrackedExternalLink href="https://zalo.me/0368903519" trackKey="contact_zalo_click" label="Zalo">
            Zalo
          </TrackedExternalLink>
          <PolicyLinks />
        </div>
        <p className="footer-copy">© 2026 Tiệm Len Nhà Tiny. Handmade with care.</p>
      </div>
    </footer>
  );
}
