"use client";

type TrackingPayload = {
  label?: string;
  href?: string;
  category?: string;
  product?: string;
};

const adEventNames: Record<string, string> = {
  nav_order_click: "NavOrderClick",
  hero_messenger_click: "HeroMessengerClick",
  hero_view_products_click: "HeroViewProductsClick",
  product_card_click: "ViewContent",
  product_messenger_click: "Contact",
  modal_order_similar_click: "Lead",
  contact_facebook_click: "ContactFacebookClick",
  contact_zalo_click: "ContactZaloClick",
  float_top_click: "FloatTopClick",
  float_zalo_click: "FloatZaloClick",
  float_facebook_click: "FloatFacebookClick",
  mobile_sticky_cta_click: "MobileStickyCtaClick",
  policy_privacy_click: "PolicyView",
  policy_terms_click: "PolicyView",
  policy_shipping_click: "PolicyView",
  policy_refund_click: "PolicyView"
};

declare global {
  interface Window {
    fbq?: (command: string, eventName: string, payload?: Record<string, unknown>) => void;
    gtag?: (...args: unknown[]) => void;
    ttq?: {
      track?: (eventName: string, payload?: Record<string, unknown>) => void;
    };
  }
}

export function trackSiteEvent(trackKey: string, params: TrackingPayload = {}) {
  if (typeof window === "undefined") return;

  const eventName = adEventNames[trackKey] || trackKey;
  const payload = {
    source: "landing_page",
    track_key: trackKey,
    ...params
  };

  if (typeof window.fbq === "function") {
    window.fbq("trackCustom", eventName, payload);
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, payload);
  }

  if (window.ttq && typeof window.ttq.track === "function") {
    window.ttq.track(eventName, payload);
  }
}

export function getTrackedElementPayload(element: HTMLElement): TrackingPayload {
  return {
    label: element.textContent?.trim().replace(/\s+/g, " ") || "",
    href: element.getAttribute("href") || "",
    category: element.dataset.category || "",
    product: element.dataset.product || ""
  };
}
