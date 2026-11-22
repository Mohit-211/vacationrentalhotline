"use client";

import StatusMessage from "@/components/ui/StatusMessage";

const LinkExpired = () => {
  return (
    <StatusMessage
      tone="warning"
      subject="Link Expired"
      text="Your password reset link has expired. If you still wish to reset your forgotten password, please go to the forgotten password page."
      buttonText="Forgotten Password?"
      buttonHref="/forgot-password"
    />
  );
};

export default LinkExpired;
