import type { Metadata } from "next";
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
  title: {
    default: "Tiệm Len Nhà Tiny",
    template: "%s | Tiệm Len Nhà Tiny"
  },
  description: "Tiệm Len Nhà Tiny - len handmade, set tự móc và quà tặng thủ công.",
  applicationName: "Tiệm Len Nhà Tiny",
  icons: {
    icon: "/images/favicon.png",
    shortcut: "/images/favicon.png",
    apple: "/images/logo.png"
  },
  openGraph: {
    siteName: "Tiệm Len Nhà Tiny"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
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
