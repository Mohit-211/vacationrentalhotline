import { LegalDocument } from "@/features/legal/LegalDocument";
import { cookiePolicyHtml } from "@/features/legal/cookiePolicy";

export default function CookiePolicyPage() {
  return <LegalDocument html={cookiePolicyHtml} />;
}
