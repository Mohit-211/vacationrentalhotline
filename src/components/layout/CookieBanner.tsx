"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { hasCookie, setCookie } from "cookies-next";
import { Button } from "@/components/ui/Button";

/**
 * Set once the visitor closes the notice. The name dates from when the banner
 * asked Allow or Deny; anyone who answered then has already seen a notice.
 */
const NOTICE_COOKIE = "vrh_cookie_consent";
/** An older name, with spaces (cookies-next 6 can't write it); it still counts. */
const LEGACY_NOTICE_COOKIE = "Vacation Rental Cookies";
const subscribe = () => () => {};

/** Remembers for a year that the notice was closed. */
const rememberClosed = () => {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  setCookie(NOTICE_COOKIE, "seen", { expires });
};

/**
 * Says what the site's cookies are for. All of them are essential (the
 * sign-in session, Stripe's fraud checks when paying, and this notice's own
 * cookie), so there is nothing to allow or deny.
 */
const CookieBanner = () => {
  // Whether the visitor has closed the notice; null on the server, which
  // can't tell. Rendering nothing until the browser knows means it never
  // flashes up for people who already closed it.
  const seen = useSyncExternalStore(
    subscribe,
    () => hasCookie(NOTICE_COOKIE) || hasCookie(LEGACY_NOTICE_COOKIE),
    () => null
  );
  const [closed, setClosed] = useState(false);

  if (seen !== false || closed) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl rounded-xl border border-border bg-surface p-5 shadow-xl sm:inset-x-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex gap-3">
          <Cookie className="mt-0.5 size-5 shrink-0 text-primary-strong" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            We use only essential cookies, to keep you signed in and to help protect payments. No advertising or
            analytics cookies.{" "}
            <Link href="/cookie-policy" className="font-semibold text-primary-strong hover:text-primary-stronger hover:underline">
              Cookie Policy
            </Link>
          </p>
        </div>
        <Button
          size="sm"
          className="shrink-0 self-end sm:self-auto"
          onClick={() => {
            rememberClosed();
            setClosed(true);
          }}
        >
          Got it
        </Button>
      </div>
    </div>
  );
};

export default CookieBanner;
