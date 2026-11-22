"use client";

import React from 'react';
import StatusMessage from '@/components/ui/StatusMessage';

const LinkExpired = () => {
  return (
    <StatusMessage
      subject="Link Expired"
      text="Your password reset link has expired. If you still wish to reset your forgotten password, please go to the forgotten password page."
      buttonText="Forgotten Password?"
      onButtonClick={() => {
        // Alternatively, you can use Next.js's <Link> component directly for navigation
        window.location.href = "/forgot-password";
      }}
    />
  );
};

export default LinkExpired;
