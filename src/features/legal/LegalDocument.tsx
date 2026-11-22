import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Container } from "@/components/ui/Container";
import { Markdown } from "./Markdown";

export type LegalDocumentName = "privacy-policy" | "terms-and-conditions" | "cookie-policy";

/**
 * Renders one of the legal documents from its Markdown file in
 * src/content/legal (edit the text there), styled by .legal-content in
 * globals.css. The pages are built ahead of time, so the file is read at build.
 */
export function LegalDocument({ name }: { name: LegalDocumentName }) {
  const source = readFileSync(path.join(process.cwd(), "src", "content", "legal", `${name}.md`), "utf8");
  return (
    <Container className="py-10 sm:py-14">
      <article className="legal-content mx-auto max-w-3xl rounded-2xl border border-border bg-surface px-6 py-8 shadow-sm sm:px-12 sm:py-12">
        <Markdown source={source} />
      </article>
    </Container>
  );
}
