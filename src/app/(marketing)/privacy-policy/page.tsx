import { LegalDocument } from "@/features/legal/LegalDocument";
import { privacyPolicyHtml } from "@/features/legal/privacyPolicy";

export default function PrivacyPolicyPage() {
  return <LegalDocument html={privacyPolicyHtml} />;
}
