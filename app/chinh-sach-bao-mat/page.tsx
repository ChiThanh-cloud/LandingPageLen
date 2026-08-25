import type { Metadata } from "next";
import { createPolicyMetadata, PolicyPage } from "@/components/policies/PolicyPage";

export const metadata: Metadata = createPolicyMetadata("privacy");

export default function PrivacyPolicyPage() {
  return <PolicyPage policyKey="privacy" />;
}
