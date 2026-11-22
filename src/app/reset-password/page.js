"use client";

import { checkResetToken } from "@/lib/api/auth";
import ResetPasswordForm from "@/features/auth/ResetPasswordForm";
import LinkExpired from "@/features/auth/LinkExpired";
import React, { useEffect, useState } from "react";

const ResetPasswordPage = () => {
  const [isLinkValid, setIsLinkValid] = useState(null); // Null represents loading state
  const [isLoading, setIsLoading] = useState(true); // Represents the redirecting state
  useEffect(() => {
    // Read the token in the browser; useSearchParams would need a Suspense boundary.
    const token = new URLSearchParams(window.location.search).get("token");
    if (token) {
      setIsLoading(false); // Stop showing the redirecting message
      const formData = { token };
      // Call the API to check link validity
      checkResetToken(formData)
        .then((res) => {
          setIsLinkValid(true); // Link is valid
        })
        .catch((error) => {
          console.log(error, "Error verifying link");
          setTimeout(() => {
            setIsLinkValid(false); // Link is expired or invalid
          }, 100);
          // Link is expired or invalid
        });
      // Wait for 1 second before making the API call
    }
  }, []);
  if (isLoading) {
    return <div>Redirecting...</div>; // Show redirecting message initially
  }
  return (
    <div>
      {isLinkValid === false && <LinkExpired />}
      {isLinkValid === true && <ResetPasswordForm />}
    </div>
  );
};
export default ResetPasswordPage;
