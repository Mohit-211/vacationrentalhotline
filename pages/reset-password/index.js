import { CheckResetPasswordLink } from "@/components/apis/authApi";
import ForgotPassword from "@/components/ForgotPassword/ForgotPassword";
import LinkExpired from "@/components/LinkExpired/LinkExpired";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const ResetPasswordPage = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isLinkValid, setIsLinkValid] = useState(null); // Null represents loading state
  const [isLoading, setIsLoading] = useState(true); // Represents the redirecting state
  useEffect(() => {
    if (token) {
      setIsLoading(false); // Stop showing the redirecting message
      const formData = { token };
      // Call the API to check link validity
      CheckResetPasswordLink(formData)
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
  }, [token]);
  if (isLoading) {
    return <div>Redirecting...</div>; // Show redirecting message initially
  }
  return (
    <div>
      {isLinkValid === false && <LinkExpired />}
      {isLinkValid === true && <ForgotPassword />}
    </div>
  );
};
export default ResetPasswordPage;
