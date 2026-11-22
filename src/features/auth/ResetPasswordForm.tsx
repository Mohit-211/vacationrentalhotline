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
import { resetPassword } from "@/lib/api/auth";
import { AuthCard } from "./AuthCard";

const schema = z
  .object({
    password: z
      .string()
      .min(1, "Please input your new password!")
      .min(8, "Password must be at least 8 characters long!")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character!"
      ),
    confirmPassword: z.string().min(1, "Please confirm your new password!"),
  })
  .refine((values) => !values.confirmPassword || values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "The two passwords do not match!",
  });
type ResetPasswordValues = z.infer<typeof schema>;

const ResetPasswordForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { password: "", confirmPassword: "" },
  });

  const handlePasswordChange = async (values: ResetPasswordValues) => {
    setLoading(true);
    const token = new URLSearchParams(window.location.search).get("token");
    const formData = {
      password: values.password,
      confirm_password: values.confirmPassword,
      token: token,
    };

    try {
      await resetPassword(formData);
      toast.success("Password changed successfully!");
      router.replace("/login");
    } catch (error) {
      console.error("Error changing password:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Reset Password" description="Choose a new password for your account.">
      <form noValidate autoComplete="off" onSubmit={handleSubmit(handlePasswordChange)} className="grid gap-5">
        <FormField id="reset_password" label="New Password" required error={errors.password?.message}>
          <PasswordInput autoComplete="new-password" {...register("password", { deps: ["confirmPassword"] })} />
        </FormField>
        <FormField id="reset_confirmPassword" label="Confirm Password" required error={errors.confirmPassword?.message}>
          <PasswordInput autoComplete="new-password" {...register("confirmPassword")} />
        </FormField>
        <Button type="submit" size="lg" loading={loading} className="w-full">
          {loading ? "Changing Password..." : "Change Password"}
        </Button>
      </form>
    </AuthCard>
  );
};

export default ResetPasswordForm;
