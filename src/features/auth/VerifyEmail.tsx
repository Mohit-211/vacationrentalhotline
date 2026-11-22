"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import StatusMessage from "@/components/ui/StatusMessage";
import { authClient, authErrorMessage, isBadLinkError } from "@/lib/auth-client";
import { authLinkClasses } from "./AuthCard";

const VerifyEmail = () => {
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [badLink, setBadLink] = useState(false);

  const handleVerify = async () => {
    const token = new URLSearchParams(window.location.search).get("token") ?? "";
    setVerifying(true);
    const { error } = await authClient.verifyEmail({ query: { token } });
    setVerifying(false);
    if (error) {
      // A bad link gets its own screen; anything else (too many tries, no
      // connection) is shown here, and the button works again.
      if (isBadLinkError(error)) setBadLink(true);
      else toast.error(authErrorMessage(error));
      return;
    }
    // Also the answer when the address was already verified.
    setVerified(true);
  };

  if (badLink) {
    return (
      <StatusMessage
        tone="warning"
        subject="Link Expired"
        text={
          <>
            This verification link is invalid or has expired. Log in and we&apos;ll email you a new one. Unverified
            accounts are removed after 12 hours, so if you signed up longer ago than that, please{" "}
            <Link href="/signup" className={authLinkClasses}>
              sign up again
            </Link>
            .
          </>
        }
        buttonText="Go to Login"
        buttonHref="/login"
      />
    );
  }
  if (verified) {
    return (
      <StatusMessage
        tone="success"
        subject="Email Verified Successfully!"
        text="Your email has been successfully verified. You may now log in to access your Vacation Rental Hotline account."
        buttonText="Back to Login"
        buttonHref="/login"
      />
    );
  }
  return (
    <StatusMessage
      subject="Verify Your Email Address"
      text="Click the button below to confirm your email address and activate your account with Vacation Rental Hotline."
      buttonText={verifying ? "Verifying…" : "Verify My Email"}
      onButtonClick={verifying ? undefined : handleVerify}
    />
  );
};

export default VerifyEmail;
