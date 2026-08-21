"use client";

import { usePathname } from "next/navigation";
import { CartProvider } from "@/components/cart/CartProvider";
import { DataTrackBridge } from "@/components/layout/DataTrackBridge";
import { FloatingContact } from "@/components/layout/FloatingContact";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PolicyModalHost } from "@/components/layout/PolicyModalHost";
import { SiteTracking } from "@/components/layout/SiteTracking";
import type { YarnContentLink } from "@/lib/products/yarn-product-content";

export function StorefrontShell({
  children,
  footerYarnLinks
}: {
  children: React.ReactNode;
  footerYarnLinks: YarnContentLink[];
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return children;

  return (
    <CartProvider>
      <SiteTracking />
      <DataTrackBridge />
      <Header />
      {children}
      <Footer yarnLinks={footerYarnLinks} />
      <PolicyModalHost />
      <FloatingContact />
    </CartProvider>
  );
}
