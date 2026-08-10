"use client";

import { usePathname } from "next/navigation";
import { CartProvider } from "@/components/cart/CartProvider";
import { DataTrackBridge } from "@/components/layout/DataTrackBridge";
import { FloatingContact } from "@/components/layout/FloatingContact";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PolicyModalHost } from "@/components/layout/PolicyModalHost";
import { SiteTracking } from "@/components/layout/SiteTracking";

export function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return children;

  return (
    <CartProvider>
      <SiteTracking />
      <DataTrackBridge />
      <Header />
      {children}
      <Footer />
      <PolicyModalHost />
      <FloatingContact />
    </CartProvider>
  );
}

