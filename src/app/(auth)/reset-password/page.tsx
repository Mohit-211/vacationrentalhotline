"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { checkResetToken } from "@/lib/api/auth";
import ResetPasswordForm from "@/features/auth/ResetPasswordForm";
import LinkExpired from "@/features/auth/LinkExpired";
import { Spinner } from "@/components/ui/Spinner";

const subscribe = () => () => {};
// Read in the browser; useSearchParams would need a Suspense boundary.
const readToken = () => new URLSearchParams(window.location.search).get("token");

const ResetPasswordPage = () => {
  const token = useSyncExternalStore(subscribe, readToken, () => null);
  const [isLinkValid, setIsLinkValid] = useState<boolean | null>(null); // null while checking

  useEffect(() => {
    if (!token) return;
    checkResetToken({ token })
      .then(() => {
        setIsLinkValid(true);
      })
      .catch((error) => {
        console.log(error, "Error verifying link");
        setTimeout(() => {
          setIsLinkValid(false);
        }, 100);
      });
  }, [token]);

  if (!token) {
    return (
      <div className="flex items-center gap-3 py-16 text-muted-foreground">
        <Spinner className="size-5" />
        Redirecting...
      </div>
    );
  }
  if (isLinkValid === false) return <LinkExpired />;
  if (isLinkValid === true) return <ResetPasswordForm />;
  return (
    <div className="flex items-center gap-3 py-16 text-muted-foreground">
      <Spinner className="size-5" />
      Checking your reset link…
    </div>
  );
};

export default ResetPasswordPage;
