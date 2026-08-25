import type { Metadata } from "next";
import { createPolicyMetadata, PolicyPage } from "@/components/policies/PolicyPage";

export const metadata: Metadata = createPolicyMetadata("shipping");

export default function ShippingPolicyPage() {
  return <PolicyPage policyKey="shipping" />;
}
