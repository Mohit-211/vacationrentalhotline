import { Container } from "@/components/ui/Container";

/**
 * Renders one of the legal documents. The HTML is our own static content,
 * converted from the Termly export and styled by .legal-content in globals.css.
 */
export function LegalDocument({ html }: { html: string }) {
  return (
    <Container className="py-10 sm:py-14">
      <article
        className="legal-content mx-auto max-w-3xl rounded-2xl border border-border bg-surface px-6 py-8 shadow-sm sm:px-12 sm:py-12"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Container>
  );
}
