declare module "@/js/products.js" {
  export function initProductModal(): void;
  export function openProductModal(type: string): Promise<void>;
  export function closeProductModal(): void;
}
