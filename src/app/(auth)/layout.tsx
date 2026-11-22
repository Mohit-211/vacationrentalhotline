import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import heroHouse from "@public/assets/hero-house.png";
import { KeepSessionLoaded } from "@/components/layout/KeepSessionLoaded";
import { Logo } from "@/components/ui/Logo";

const highlights = ["Calls answered 24/7", "Text to owner if a call received", "Email to owner / property manager"];

/**
 * Shared frame for sign-in, sign-up, password and verification screens: the
 * form on one side and, on wide screens, the brand's promise on the other.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-2">
      {/* So the header's Sign Up and Login show at once on the way back. */}
      <KeepSessionLoaded />
      {/* The brand panel stays in view while a long form scrolls. */}
      <aside className="relative hidden overflow-hidden bg-linear-to-br from-primary-stronger via-primary-strong to-secondary-strong text-on-strong lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:p-10 xl:p-14">
        <div aria-hidden="true" className="absolute -top-32 -right-24 size-96 rounded-full bg-primary/30 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-40 -left-20 size-96 rounded-full bg-secondary/25 blur-3xl" />
        <Link href="/" className="relative self-start rounded-full bg-surface px-4 py-2 shadow-lg">
          <Logo priority className="h-9" />
        </Link>
        <div className="relative mt-auto max-w-md">
          {/* Not a heading: the form's title is the page's heading. */}
          <p className="font-heading text-3xl leading-tight font-extrabold xl:text-4xl">
            Calls answered 24/7, 365 days a year
          </p>
          <p className="mt-4 text-lg leading-relaxed">
            A live representative takes neighbor calls about your rental, then texts and emails you the details.
          </p>
          <ul className="mt-8 space-y-3 text-sm font-medium">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-on-strong text-secondary-strong">
                  <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <Image
          src={heroHouse}
          alt=""
          sizes="(min-width: 1280px) 34rem, 44vw"
          className="relative mx-auto mt-8 -mb-24 w-full max-w-lg animate-float drop-shadow-float xl:-mb-28"
        />
      </aside>

      <div className="flex min-h-dvh flex-col">
        {/* On phones, a thin strip of the brand gradient instead of the panel. */}
        <div aria-hidden="true" className="h-1.5 bg-linear-to-r from-primary-strong to-secondary-strong lg:hidden" />
        <header className="flex h-20 items-center justify-between gap-4 px-4 sm:px-8">
          <Link href="/" className="rounded-md lg:invisible">
            <Logo priority className="h-10" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-surface-muted hover:text-primary-strong"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Go to Home
          </Link>
        </header>
        <main className="flex flex-1 justify-center px-4 pt-4 pb-16 sm:items-center sm:px-8 sm:pt-0">{children}</main>
      </div>
    </div>
  );
}
