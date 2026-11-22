"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import StatusMessage from "@/components/ui/StatusMessage";
import { authClient, authErrorMessage } from "@/lib/auth-client";

const VerifyEmailChange = () => {
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const router = useRouter();

  const handleVerify = async () => {
    const token = new URLSearchParams(window.location.search).get("token") ?? "";
    setVerifying(true);
    const { error } = await authClient.verifyEmail({ query: { token } });
    if (error) {
      setVerifying(false);
      toast.error(authErrorMessage(error));
      setTimeout(() => router.push("/login"), 3000);
      return;
    }
    // The address changed: sign out so the next sign-in uses the new one.
    await authClient.signOut();
    setVerifying(false);
    setVerified(true);
  };

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
