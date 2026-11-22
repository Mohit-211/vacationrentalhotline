"use client";

import { useSyncExternalStore } from "react";
import ResetPasswordForm from "@/features/auth/ResetPasswordForm";
import LinkExpired from "@/features/auth/LinkExpired";

const subscribe = () => () => {};
// Read in the browser; useSearchParams would need a Suspense boundary.
const readParams = () => window.location.search;

/**
 * The emailed reset link goes through /api/auth/reset-password/:token, which
 * checks the token and then opens this page with ?token=... when it's valid,
 * or ?error=INVALID_TOKEN when it has expired or was already used.
 */
const ResetPasswordPage = () => {
  const search = useSyncExternalStore(subscribe, readParams, () => null);
  if (search === null) return null;
  const params = new URLSearchParams(search);
  if (params.get("error") || !params.get("token")) return <LinkExpired />;
  return <ResetPasswordForm />;
};

export default ResetPasswordPage;
