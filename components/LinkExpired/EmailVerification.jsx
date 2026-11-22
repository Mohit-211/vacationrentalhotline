// EmailVerification.jsx
import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { VerifyEmail } from "../apis/authApi";
import MessageTemplate from "../CommoneMessage/CommonMessage";

const EmailVerification = () => {
  const [verified, setVerified] = useState(false); // State to track if verification was successful
  const [alreadyVerified, setAlreadyVerified] = useState(false); // State to track if email is already verified
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const handleVerify = () => {
    const formData = { token };
    VerifyEmail(formData)
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
        <MessageTemplate
          subject="Email Verified Successfully!"
          text="Your email has been successfully verified. You may now log in to access your Vacation Rental Hotline account."
          buttonText="Back to Login"
          onButtonClick={() => router.push("/login")}
        />
      ) : alreadyVerified ? (
        <MessageTemplate
          subject="Email Already Verified"
          text="It looks like your email has already been verified. You can go ahead and Log In to access your Vacation Rental Hotline account."
          buttonText="Back to Login"
          onButtonClick={() => router.push("/login")}
        />
      ) : (
        <MessageTemplate
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
