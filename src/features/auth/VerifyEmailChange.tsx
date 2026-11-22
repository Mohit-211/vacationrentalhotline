"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import StatusMessage from "@/components/ui/StatusMessage";
import { authClient, authErrorMessage, isBadLinkError } from "@/lib/auth-client";

const VerifyEmailChange = () => {
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [badLink, setBadLink] = useState(false);
  const router = useRouter();

  const handleVerify = async () => {
    const token = new URLSearchParams(window.location.search).get("token") ?? "";
    setVerifying(true);
    const { error } = await authClient.verifyEmail({ query: { token } });
    if (error) {
      setVerifying(false);
      if (isBadLinkError(error)) setBadLink(true);
      else toast.error(authErrorMessage(error));
      return;
    }
    // The address changed: sign out so the next sign-in uses the new one.
    await authClient.signOut();
    setVerifying(false);
    setVerified(true);
  };

  if (badLink) {
    return (
      <StatusMessage
        tone="warning"
        subject="Link Expired"
        text="This link is invalid or has expired, so your email hasn't changed. To change it, request the change again from your account."
        buttonText="Go to My Account"
        onButtonClick={() => router.push("/account")}
      />
    );
  }
  if (verified) {
    return (
      <StatusMessage
        tone="success"
        subject="Email Verified Successfully!"
        text="Your new email address is verified and now on your account. Log in with it to access your Vacation Rental Hotline account."
        buttonText="Back to Login"
        onButtonClick={() => router.push("/login")}
      />
    );
  }
  return (
    <StatusMessage
      subject="Verify Your New Email Address"
      text="Click the button below to confirm your new email address for your Vacation Rental Hotline account."
      buttonText={verifying ? "Verifying…" : "Verify My Email"}
      onButtonClick={verifying ? undefined : handleVerify}
    />
  );
};

export default VerifyEmailChange;
