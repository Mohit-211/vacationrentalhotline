"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { hasCookie, setCookie } from "cookies-next";
import { Button } from "@/components/ui/Button";

const CONSENT_COOKIE = "vrh_cookie_consent";
/**
 * The old name. Spaces aren't allowed in cookie names, and cookies-next 6
 * refuses to write one (both buttons threw), but browsers that stored it
 * earlier still count as having chosen.
 */
const LEGACY_CONSENT_COOKIE = "Vacation Rental Cookies";
const subscribe = () => () => {};

/** Remembers Allow ("true") or Deny ("false") for a year, so the banner doesn't come back. */
const remember = (choice: boolean) => {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  setCookie(CONSENT_COOKIE, choice, { expires });
};

const CookieBanner = () => {
  // Whether the visitor has chosen; null on the server, which can't tell.
  // Rendering nothing until the browser knows means the banner never
  // flashes up for people who already chose.
  const decided = useSyncExternalStore(
    subscribe,
    () => hasCookie(CONSENT_COOKIE) || hasCookie(LEGACY_CONSENT_COOKIE),
    () => null
  );
  const [dismissed, setDismissed] = useState(false);

  const choose = (choice: boolean) => {
    remember(choice);
    setDismissed(true);
  };

  if (decided !== false || dismissed) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-xl border border-border bg-surface p-5 shadow-xl sm:inset-x-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex gap-3">
          <Cookie className="mt-0.5 size-5 shrink-0 text-primary-strong" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            We use cookies to personalise content and ads, to provide social media features, and to analyse our
            traffic. We also share information about your use of our site with our social media, advertising, and
            analytics partners who may combine it with other information that you’ve provided to them or that
            they’ve collected from your use of their services.{" "}
            <Link href="/cookie-policy" className="font-semibold text-primary-strong hover:text-primary-stronger hover:underline">
              Read More
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => choose(false)}>
            Deny
          </Button>
          <Button size="sm" onClick={() => choose(true)}>
            Allow
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
