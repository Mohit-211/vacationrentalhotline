import { LegalDocument } from "@/features/legal/LegalDocument";
import { termsAndConditionsHtml } from "@/features/legal/termsAndConditions";

export default function TermsAndConditionsPage() {
  return <LegalDocument html={termsAndConditionsHtml} />;
}
