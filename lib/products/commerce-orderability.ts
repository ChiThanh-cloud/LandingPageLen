export function isCommerceProductOrderable(status: string | null | undefined) {
  return status !== "out" && status !== "hidden";
}

export function isCommerceVariantOrderable(status: string | null | undefined) {
  return status !== "out" && status !== "hidden";
}
