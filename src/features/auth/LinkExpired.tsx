"use client";

import { useRouter } from "next/navigation";
import StatusMessage from "@/components/ui/StatusMessage";

const LinkExpired = () => {
  const router = useRouter();
  return (
    <StatusMessage
      tone="warning"
      subject="Link Expired"
      text="Your password reset link has expired. If you still wish to reset your forgotten password, please go to the forgotten password page."
      buttonText="Forgotten Password?"
      onButtonClick={() => router.push("/forgot-password")}
    />
  );
};

export default LinkExpired;
