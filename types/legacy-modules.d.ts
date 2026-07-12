declare module "@/js/products.js" {
  export function initProductModal(): void;
  export function openProductModal(type: string): Promise<void>;
  export function closeProductModal(): void;
}

declare module "@/js/policy-modal.js" {
  export function initPolicyModal(): void;
  export function openPolicyModal(type: "privacy" | "terms" | "shipping" | "refund"): void;
  export function closePolicyModal(): void;
}
