"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import StatusMessage from "@/components/ui/StatusMessage";
import { authClient, authErrorMessage } from "@/lib/auth-client";

const VerifyEmail = () => {
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const router = useRouter();

  const handleVerify = async () => {
    const token = new URLSearchParams(window.location.search).get("token") ?? "";
    setVerifying(true);
    const { error } = await authClient.verifyEmail({ query: { token } });
    setVerifying(false);
    if (error) {
      // The link expired: send them back to sign up (signing in also sends a new link).
      toast.error(authErrorMessage(error));
      setTimeout(() => router.push("/signup"), 3000);
      return;
    }
    // Also the answer when the address was already verified.
    setVerified(true);
  };

  if (verified) {
    return (
      <StatusMessage
        tone="success"
        subject="Email Verified Successfully!"
        text="Your email has been successfully verified. You may now log in to access your Vacation Rental Hotline account."
        buttonText="Back to Login"
        onButtonClick={() => router.push("/login")}
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
