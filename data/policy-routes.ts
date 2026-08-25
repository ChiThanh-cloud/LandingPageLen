export const policyRoutes = {
  privacy: {
    slug: "chinh-sach-bao-mat",
    title: "Chính sách bảo mật",
    label: "Chính sách bảo mật",
    trackKey: "policy_privacy_click"
  },
  terms: {
    slug: "dieu-khoan-dich-vu",
    title: "Điều khoản dịch vụ",
    label: "Điều khoản dịch vụ",
    trackKey: "policy_terms_click"
  },
  shipping: {
    slug: "van-chuyen",
    title: "Chính sách vận chuyển",
    label: "Vận chuyển",
    trackKey: "policy_shipping_click"
  },
  refund: {
    slug: "doi-tra-hoan-tien",
    title: "Chính sách đổi trả & hoàn tiền",
    label: "Đổi trả & hoàn tiền",
    trackKey: "policy_refund_click"
  }
} as const;

export type PolicyKey = keyof typeof policyRoutes;

export const policyLinks = (Object.keys(policyRoutes) as PolicyKey[]).map((key) => ({
  key,
  ...policyRoutes[key]
}));
