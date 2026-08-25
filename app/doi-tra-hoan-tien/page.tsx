import type { Metadata } from "next";
import { createPolicyMetadata, PolicyPage } from "@/components/policies/PolicyPage";

export const metadata: Metadata = createPolicyMetadata("refund");

export default function RefundPolicyPage() {
  return <PolicyPage policyKey="refund" />;
}
