import type { OrderReceivedEmailProps } from "@/emails/OrderReceivedEmail";

export const orderReceivedEmailPreview: OrderReceivedEmailProps = {
  customerName: "Nguyễn Thanh",
  customerEmail: "preview@example.test",
  orderCode: "TINY-A1B2C3D4E5F6",
  items: [
    { productName: "Len Milk Bò", variantName: "Mã 12", colorCode: "12", quantity: 3, lineTotal: 75_000 },
    { productName: "Len Nhung Đũa", variantName: "Mã 07", colorCode: "07", quantity: 2, lineTotal: 50_000 }
  ],
  subtotal: 125_000,
  shippingFee: null,
  total: null,
  paymentMethod: "cod",
  shippingAddress: {
    customerName: "Nguyễn Thanh",
    addressLine: "123 Đường Mẫu",
    ward: "Phường Mẫu",
    district: "Quận Mẫu",
    province: "TP. Hồ Chí Minh"
  }
};
