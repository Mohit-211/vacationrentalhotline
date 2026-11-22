import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";

/** Shared frame for sign-in, sign-up, password and verification screens. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header>
        <Container className="flex h-20 items-center justify-between gap-4">
          <Link href="/" className="rounded-md">
            <Logo priority className="h-10" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-muted-foreground transition-colors hover:text-primary-strong"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Go to Home
          </Link>
        </Container>
      </header>
      <main className="flex flex-1 justify-center px-4 pt-4 pb-16 sm:items-center sm:pt-0">{children}</main>
    </div>
  );
}
