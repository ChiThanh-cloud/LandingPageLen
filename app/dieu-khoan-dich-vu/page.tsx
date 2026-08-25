import type { Metadata } from "next";
import { createPolicyMetadata, PolicyPage } from "@/components/policies/PolicyPage";

export const metadata: Metadata = createPolicyMetadata("terms");

export default function TermsOfServicePage() {
  return <PolicyPage policyKey="terms" />;
}
