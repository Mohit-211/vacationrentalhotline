"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { hasCookie, setCookie } from "cookies-next";
import { Button } from "@/components/ui/Button";

const CONSENT_COOKIE = "Vacation Rental Cookies";
const subscribe = () => () => {};

const CookieBanner = () => {
  // The server can't see the cookie, so the banner renders there and hides
  // after hydration for people who already accepted.
  const accepted = useSyncExternalStore(
    subscribe,
    () => hasCookie(CONSENT_COOKIE),
    () => false
  );
  const [dismissed, setDismissed] = useState(false);

  const acceptCookies = () => {
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    setCookie(CONSENT_COOKIE, true, { expires: expiryDate });
    setDismissed(true);
  };

  const declineCookies = () => {
    setDismissed(true);
  };

  if (accepted || dismissed) {
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
          <Button variant="outline" size="sm" onClick={declineCookies}>
            Deny
          </Button>
          <Button size="sm" onClick={acceptCookies}>
            Allow
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
