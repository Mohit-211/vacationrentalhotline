"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { verifyEmail } from "@/lib/api/auth";
import StatusMessage from "@/components/ui/StatusMessage";

const EmailVerification = () => {
  const [verified, setVerified] = useState(false); // State to track if verification was successful
  const [alreadyVerified, setAlreadyVerified] = useState(false); // State to track if email is already verified
  const router = useRouter();

  const handleVerify = () => {
    const token = new URLSearchParams(window.location.search).get("token");
    const formData = { token };
    verifyEmail(formData)
      .then((res) => {
        setVerified(true); // Set verified to true on successful response
      })
      .catch((e) => {
        console.log(e);
        if (e?.response?.data?.message === "Email Already Verified") {
          setAlreadyVerified(true); // Set alreadyVerified to true if email is already verified
        }
        if (e?.response?.data?.status === 410) {
          setTimeout(() => router.push("/signup"), 3000);
        }
      });
  };

  return (
    <>
      {verified ? (
        <StatusMessage
          subject="Email Verified Successfully!"
          text="Your email has been successfully verified. You may now log in to access your Vacation Rental Hotline account."
          buttonText="Back to Login"
          onButtonClick={() => router.push("/login")}
        />
      ) : alreadyVerified ? (
        <StatusMessage
          subject="Email Already Verified"
          text="It looks like your email has already been verified. You can go ahead and Log In to access your Vacation Rental Hotline account."
          buttonText="Back to Login"
          onButtonClick={() => router.push("/login")}
        />
      ) : (
        <StatusMessage
          subject="Verify Your Email Address"
          text="Click the button below to confirm your email address and activate your account with Vacation Rental Hotline."
          buttonText="Verify My Email"
          onButtonClick={handleVerify}
        />
      )}
        
    </>
  );
};

export default EmailVerification;
