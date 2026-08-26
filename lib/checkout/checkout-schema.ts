import { z } from "zod";
import { resolveCommerceCartItems, type ResolvedCommerceCartItem } from "@/lib/cart/cart-commerce";
import type { CartItem } from "@/types/yarn-product";
import type { CommerceProduct } from "@/types/commerce-product";

export const paymentMethodSchema = z.enum(["cod", "bank_transfer"]);

function isReasonableVietnamesePhone(value: string) {
  const normalized = value.replace(/[\s().-]/g, "");
  return /^(?:\+84|84|0)\d{8,10}$/.test(normalized);
}

export const checkoutFormSchema = z.object({
  customerName: z.string().trim().min(1, "Vui lòng nhập họ và tên.").max(120, "Họ và tên quá dài."),
  phone: z.string().trim().min(1, "Vui lòng nhập số điện thoại.").max(24, "Số điện thoại quá dài.").refine(
    isReasonableVietnamesePhone,
    "Số điện thoại chưa đúng định dạng Việt Nam."
  ),
  email: z.string().trim().max(254, "Email quá dài.").refine(
    (value) => value === "" || z.string().email().safeParse(value).success,
    "Email chưa đúng định dạng."
  ),
  province: z.string().trim().min(1, "Vui lòng nhập Tỉnh / Thành phố.").max(120, "Tỉnh / Thành phố quá dài."),
  district: z.string().trim().min(1, "Vui lòng nhập Quận / Huyện.").max(120, "Quận / Huyện quá dài."),
  ward: z.string().trim().min(1, "Vui lòng nhập Phường / Xã.").max(120, "Phường / Xã quá dài."),
  addressLine: z.string().trim().min(1, "Vui lòng nhập địa chỉ cụ thể.").max(240, "Địa chỉ quá dài."),
  shippingNote: z.string().trim().max(500, "Ghi chú quá dài."),
  paymentMethod: paymentMethodSchema
});

export type CheckoutFormValues = z.input<typeof checkoutFormSchema>;
export type ValidCheckoutFormValues = z.output<typeof checkoutFormSchema>;

export const checkoutPayloadSchema = z.object({
  customer: z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string()
  }),
  shipping: z.object({
    province: z.string(),
    district: z.string(),
    ward: z.string(),
    addressLine: z.string(),
    note: z.string()
  }),
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string(),
    quantity: z.number().int().positive()
  })).min(1),
  paymentMethod: paymentMethodSchema
});

export type CheckoutPayload = z.infer<typeof checkoutPayloadSchema>;

export function createCheckoutPayload(values: ValidCheckoutFormValues, items: CartItem[]): CheckoutPayload {
  return checkoutPayloadSchema.parse({
    customer: {
      name: values.customerName,
      phone: values.phone,
      email: values.email
    },
    shipping: {
      province: values.province,
      district: values.district,
      ward: values.ward,
      addressLine: values.addressLine,
      note: values.shippingNote
    },
    items: items.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity })),
    paymentMethod: values.paymentMethod
  });
}

export type CheckoutItemIssue =
  | "missing-product"
  | "missing-variant"
  | "out-of-stock"
  | "insufficient-stock";

export type ResolvedCheckoutItem = ResolvedCommerceCartItem & {
  issue: CheckoutItemIssue | null;
  issueMessage: string | null;
};

export function resolveCheckoutItems(items: CartItem[], availableProducts: CommerceProduct[]): ResolvedCheckoutItem[] {
  return resolveCommerceCartItems(items, availableProducts).map((entry) => {
    const { item, product, variant } = entry;
    let issue: CheckoutItemIssue | null = null;
    let issueMessage: string | null = null;

    if (!product) {
      issue = "missing-product";
      issueMessage = "Sản phẩm không còn khả dụng.";
    } else if (!variant) {
      issue = "missing-variant";
      issueMessage = "Lựa chọn này không còn khả dụng.";
    } else if (variant.stock === 0) {
      issue = "out-of-stock";
      issueMessage = "Lựa chọn này hiện đã hết hàng.";
    } else if (variant.stock !== null && item.quantity > variant.stock) {
      issue = "insufficient-stock";
      issueMessage = `Hiện chỉ còn ${variant.stock} ${product.unitLabel}. Vui lòng cập nhật số lượng trong giỏ hàng.`;
    }

    return {
      ...entry,
      issue,
      issueMessage
    };
  });
}
