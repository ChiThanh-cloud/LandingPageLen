import type { Metadata } from "next";
import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google";
import { siteConfig } from "@/data/site";
import "../css/base.css";
import "../css/layout.css";
import "../css/sections.css";
import "../css/animations.css";
import "../css/products.css";
import "../css/category-pages.css";
import "../css/responsive.css";
import "../css/blog.css";
import "./blog/blog-pages.css";
import "./san-pham/product-pages.css";
import "./globals.css";
import "../css/yarn-product.css";
import { StorefrontShell } from "@/components/layout/StorefrontShell";
import { getAllYarnProducts } from "@/lib/products/supabase-products";
import { getPrimaryYarnNavigationLinks } from "@/lib/products/yarn-product-content";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  description: "Tiệm Len Nhà Tiny – shop len handmade tại TP.HCM chuyên tư vấn cuộn len, set tự móc, đồ móc theo yêu cầu và quà tặng handmade. Nhắn Messenger để được Tiny báo giá nhanh.",
  applicationName: siteConfig.name,
  icons: {
    icon: "/images/favicon.png",
    shortcut: "/images/favicon.png",
    apple: "/images/logo.png"
  },
  openGraph: {
    siteName: siteConfig.name,
    type: "website",
    locale: siteConfig.locale
  },
  twitter: {
    card: "summary_large_image"
  },
  robots: {
    index: true,
    follow: true
  }
};

const playfair = Playfair_Display({
  subsets: ["vietnamese"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-playfair"
});

const beVietnam = Be_Vietnam_Pro({
  subsets: ["vietnamese"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-be-vietnam"
});

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  let footerYarnLinks: ReturnType<typeof getPrimaryYarnNavigationLinks> = [];
  try {
    footerYarnLinks = getPrimaryYarnNavigationLinks(await getAllYarnProducts());
  } catch {
    console.error("Unable to load yarn links for the storefront footer");
  }

  return (
    <html lang="vi" data-scroll-behavior="smooth" className={`${playfair.variable} ${beVietnam.variable}`}>
      <head>
      </head>
      <body>
        <StorefrontShell footerYarnLinks={footerYarnLinks}>{children}</StorefrontShell>
      </body>
    </html>
  );
}
