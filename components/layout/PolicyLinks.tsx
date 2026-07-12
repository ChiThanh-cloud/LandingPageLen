"use client";

import { trackSiteEvent } from "@/lib/siteTracking";

type PolicyType = "privacy" | "terms" | "shipping" | "refund";

const links: Array<{ type: PolicyType; label: string; trackKey: string }> = [
  { type: "privacy", label: "Chính sách bảo mật", trackKey: "policy_privacy_click" },
  { type: "terms", label: "Điều khoản dịch vụ", trackKey: "policy_terms_click" },
  { type: "shipping", label: "Vận chuyển", trackKey: "policy_shipping_click" },
  { type: "refund", label: "Đổi trả & hoàn tiền", trackKey: "policy_refund_click" }
];

export function PolicyLinks() {
  const openPolicy = async (type: PolicyType, label: string, trackKey: string) => {
    const { openPolicyModal } = await import("@/js/policy-modal.js");
    openPolicyModal(type);
    trackSiteEvent(trackKey, { label, href: "#" });
  };

  return (
    <>
      {links.map((link) => (
        <button
          key={link.type}
          className="footer-policy-link"
          type="button"
          data-track={link.trackKey}
          data-track-handled="true"
          onClick={() => openPolicy(link.type, link.label, link.trackKey)}
        >
          {link.label}
        </button>
      ))}
    </>
  );
}
