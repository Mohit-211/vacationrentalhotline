"use client";

import React, { useEffect, useState } from "react";
import { Button, Container } from "react-bootstrap";
import styles from "./Profile.module.scss";
import Header from "@/components/layout/Header";
import EditProfileForm from "./EditProfileForm";
import ChangePasswordForm from "./ChangePasswordForm";
import ChangeEmailForm from "./ChangeEmailForm";
import StatusMessage from "@/components/ui/StatusMessage";
import { useRouter } from "next/navigation";
import { getProfile } from "@/lib/api/profile";
import type { UserProfile } from "@/lib/api/types";

const Profile = () => {
  const [value, setValue] = useState("edit");
  const [isClient, setIsClient] = useState(false);
  const [isPasswordChanged, setIsPasswordChanged] = useState(false);
  const [isEmailChanged, setIsEmailChanged] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile>();
  const router = useRouter();

  useEffect(() => {
    getProfile()
      .then((res) => {
        setProfileData(res?.data?.data);
      })
      .catch((e) => {
        console.log(e, "error in profile");
      });
  }, []);

  const handleValueChangeEdit = () => {
    setValue("edit");
    setIsPasswordChanged(false);
    setIsEmailChanged(false);
  };

  const handleValueChangePassword = () => {
    setValue("change_password");
    setIsPasswordChanged(false);
    setIsEmailChanged(false);
  };

  const handleValueChangeEmail = () => {
    setValue("change_email");
    setIsEmailChanged(false);
  };

  const handlePasswordChangeSuccess = () => {
    setIsPasswordChanged(true);
  };

  const handleEmailChangeSuccess = () => {
    setIsEmailChanged(true);
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      {!isPasswordChanged && !isEmailChanged && (
        <Container className={styles.ProfileComponent}>
          <Header />
          <div className={styles.profile_inner}>
            <div className={styles.section2}>
              <div className={styles.btn_tab}>
                <h4>{profileData?.user_profile?.name}</h4>
                <h6>{profileData?.email}</h6>
                <Button
                  className={styles.btn_theme_div}
                  style={{
                    background: value === "edit" ? "" : "unset",
                    color: value === "edit" ? "white" : "black",
                    border: "1px solid #0194d9",
                  }}
                  onClick={handleValueChangeEdit}
                >
                  Profile Edit
                </Button>
                <Button
                  className={styles.btn_theme_div}
                  style={{
                    background: value === "change_password" ? "" : "unset",
                    color: value === "change_password" ? "white" : "black",
                    border: "1px solid #0194d9",
                  }}
                  onClick={handleValueChangePassword}
                >
                  Change Password
                </Button>
                <Button
                  className={styles.btn_theme_div}
                  style={{
                    background: value === "change_email" ? "" : "unset",
                    color: value === "change_email" ? "white" : "black",
                    border: "1px solid #0194d9",
                  }}
                  onClick={handleValueChangeEmail}
                >
                  Change Email
                </Button>
              </div>
              <div className={styles.sectionline}>
                <div className={styles.line}></div>
              </div>
              <div className={styles.Form_ctm}>
                {isClient && value === "edit" && <EditProfileForm />}
                {isClient &&
                  value === "change_password" &&
                  !isPasswordChanged && (
                    <ChangePasswordForm
                      onPasswordChangeSuccess={handlePasswordChangeSuccess}
                    />
                  )}
                {isClient && value === "change_email" && !isEmailChanged && (
                  <ChangeEmailForm
                    onEmailChangeSuccess={handleEmailChangeSuccess}
                  />
                )}
              </div>
            </div>
          </div>
        </Container>
      )}
      {isPasswordChanged && (
        <StatusMessage
          subject="Password Updated Successfully!"
          text="Your password has been successfully updated. You may now log in with your new password to access your Vacation Rental Hotline account."
          buttonText="Back to Login"
          onButtonClick={() => router.push("/login")}
        />
      )}
      {isEmailChanged&&
      <StatusMessage
        subject="Email Change Request Submitted Successfully!"
        text={
          "Your request to change your email address has been submitted. A verification email has been sent to your new email address. Please check your inbox and verify your new email to complete the update if You have not requested an email change. You can go back to your profile to view your current details."
        }
        buttonText="Go to Profile"
        onButtonClick={handleValueChangeEdit} // Takes user back to profile page
      />
      }
    </>
  );
};

export default Profile;
