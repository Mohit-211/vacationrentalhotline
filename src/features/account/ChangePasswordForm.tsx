"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { PASSWORD_HINT, passwordSchema } from "@/lib/schemas/password";

const schema = z
  .object({
    oldpassword: z.string().min(1, "Please input your old password!"),
    password: z.string().min(1, "Please input your password!").pipe(passwordSchema),
    confirmPassword: z.string().min(1, "Please confirm your password!"),
  })
  .refine((values) => !values.confirmPassword || values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "The passwords do not match!",
  });
type ChangePasswordValues = z.infer<typeof schema>;

/**
 * Changes the password, signs out every session (this one included) and
 * emails a notice. Without `onPasswordChangeSuccess`, goes to the login page.
 */
const ChangePasswordForm = ({ onPasswordChangeSuccess }: { onPasswordChangeSuccess?: () => void }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { oldpassword: "", password: "", confirmPassword: "" },
  });

  const handlePasswordChange = async (values: ChangePasswordValues) => {
    setLoading(true);
    const { error } = await authClient.changePassword({
      currentPassword: values.oldpassword,
      newPassword: values.password,
      revokeOtherSessions: true,
    });
    if (error) {
      setLoading(false);
      toast.error(authErrorMessage(error));
      return;
    }
    // As before, the next step is logging in again with the new password.
    await authClient.signOut();
    setLoading(false);
    toast.success("Password changed successfully");
    if (onPasswordChangeSuccess) onPasswordChangeSuccess();
    else router.push("/login");
  };

  return (
    <form method="post" noValidate onSubmit={handleSubmit(handlePasswordChange)} className="grid max-w-md gap-5">
      <FormField id="change_password_oldpassword" label="Old Password" required error={errors.oldpassword?.message}>
        <PasswordInput autoComplete="current-password" {...register("oldpassword")} />
      </FormField>
      <FormField
        id="change_password_password"
        label="Password"
        required
        hint={PASSWORD_HINT}
        error={errors.password?.message}
      >
        <PasswordInput
          placeholder="*****"
          autoComplete="new-password"
          {...register("password", { deps: ["confirmPassword"] })}
        />
      </FormField>
      <FormField
        id="change_password_confirmPassword"
        label="Confirm Password"
        required
        error={errors.confirmPassword?.message}
      >
        <PasswordInput placeholder="*****" autoComplete="new-password" {...register("confirmPassword")} />
      </FormField>
      <Button type="submit" size="lg" loading={loading} className="w-full">
        Change Password
      </Button>
    </form>
  );
};

export default ChangePasswordForm;
