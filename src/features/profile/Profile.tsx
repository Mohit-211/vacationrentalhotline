"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AtSign, KeyRound, UserRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import StatusMessage from "@/components/ui/StatusMessage";
import { getProfile } from "@/lib/api/profile";
import type { UserProfile } from "@/lib/api/types";
import { useIsClient } from "@/lib/useIsClient";
import EditProfileForm from "./EditProfileForm";
import ChangePasswordForm from "./ChangePasswordForm";
import ChangeEmailForm from "./ChangeEmailForm";

const tabTriggerClasses =
  "w-full justify-start gap-3 px-3 py-2.5 data-[state=active]:bg-primary-soft data-[state=active]:text-primary-stronger data-[state=active]:shadow-none [&_svg]:size-4";

const Profile = () => {
  const [value, setValue] = useState("edit");
  const isClient = useIsClient();
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

  const handleValueChange = (next: string) => {
    setValue(next);
    if (next !== "change_email") setIsPasswordChanged(false);
    setIsEmailChanged(false);
  };

  const handleValueChangeEdit = () => handleValueChange("edit");

  if (isPasswordChanged) {
    return (
      <StatusMessage
        tone="success"
        subject="Password Updated Successfully!"
        text="Your password has been successfully updated. You may now log in with your new password to access your Vacation Rental Hotline account."
        buttonText="Back to Login"
        onButtonClick={() => router.push("/login")}
      />
    );
  }
  if (isEmailChanged) {
    return (
      <StatusMessage
        subject="Email Change Request Submitted Successfully!"
        text="Your request to change your email address has been submitted. A verification email has been sent to your new email address. Please check your inbox and verify your new email to complete the update. If you have not requested an email change, you can go back to your profile to view your current details."
        buttonText="Go to Profile"
        onButtonClick={handleValueChangeEdit}
      />
    );
  }

  return (
    <Tabs
      value={value}
      onValueChange={handleValueChange}
      orientation="vertical"
      className="grid items-start gap-6 lg:grid-cols-[18rem_1fr]"
    >
      <aside className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-center gap-3 border-b border-border pb-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-strong">
            <UserRound className="size-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-heading font-bold">{profileData?.user_profile?.name}</p>
            <p className="truncate text-sm text-muted-foreground">{profileData?.email}</p>
          </div>
        </div>
        <TabsList className="mt-4 flex h-auto w-full flex-col items-stretch gap-1 bg-transparent p-0">
          <TabsTrigger value="edit" className={tabTriggerClasses}>
            <UserRound aria-hidden="true" />
            Profile Edit
          </TabsTrigger>
          <TabsTrigger value="change_password" className={tabTriggerClasses}>
            <KeyRound aria-hidden="true" />
            Change Password
          </TabsTrigger>
          <TabsTrigger value="change_email" className={tabTriggerClasses}>
            <AtSign aria-hidden="true" />
            Change Email
          </TabsTrigger>
        </TabsList>
      </aside>
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <TabsContent value="edit">
          <h1 className="mb-6 text-2xl font-bold">Profile</h1>
          {isClient && <EditProfileForm />}
        </TabsContent>
        <TabsContent value="change_password">
          <h1 className="mb-6 text-2xl font-bold">Change Password</h1>
          {isClient && <ChangePasswordForm onPasswordChangeSuccess={() => setIsPasswordChanged(true)} />}
        </TabsContent>
        <TabsContent value="change_email">
          <h1 className="mb-6 text-2xl font-bold">Change Email</h1>
          {isClient && <ChangeEmailForm onEmailChangeSuccess={() => setIsEmailChanged(true)} />}
        </TabsContent>
      </section>
    </Tabs>
  );
};

export default Profile;
