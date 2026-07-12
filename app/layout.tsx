import type { Metadata } from "next";
import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google";
import { siteConfig } from "@/data/site";
import "../css/base.css";
import "../css/layout.css";
import "../css/sections.css";
import "../css/animations.css";
import "../css/products.css";
import "../css/responsive.css";
import "../css/blog.css";
import "./blog/blog-pages.css";
import "./san-pham/product-pages.css";
import "./globals.css";
import { DataTrackBridge } from "@/components/layout/DataTrackBridge";
import { FloatingContact } from "@/components/layout/FloatingContact";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PolicyModalHost } from "@/components/layout/PolicyModalHost";
import { SiteTracking } from "@/components/layout/SiteTracking";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  description: "Tiệm Len Nhà Tiny - len handmade, set tự móc và quà tặng thủ công.",
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

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" data-scroll-behavior="smooth" className={`${playfair.variable} ${beVietnam.variable}`}>
      <head>
      </head>
      <body>
        <SiteTracking />
        <DataTrackBridge />
        <Header />
        {children}
        <Footer />
        <PolicyModalHost />
        <FloatingContact />
      </body>
    </html>
  );
}
