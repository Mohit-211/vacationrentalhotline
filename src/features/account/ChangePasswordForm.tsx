"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { changePassword } from "@/lib/api/auth";
import type { ApiErrorBody } from "@/lib/api/types";
import { clearToken } from "@/lib/session";

const schema = z
  .object({
    oldpassword: z.string().min(1, "Please input your old password!"),
    password: z
      .string()
      .min(1, "Please input your password!")
      .min(8, "Password must be at least 8 characters long!")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character!"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password!"),
  })
  .refine((values) => !values.confirmPassword || values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "The passwords do not match!",
  });
type ChangePasswordValues = z.infer<typeof schema>;

const ChangePasswordForm = ({ onPasswordChangeSuccess }: { onPasswordChangeSuccess?: () => void }) => {
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
    const formData = {
      old_password: values.oldpassword,
      new_password: values.password,
      confirm_password: values.confirmPassword,
    };

    try {
      const response = await changePassword(formData);
      toast.success(response?.data?.message || "Password changed successfully");
      clearToken();
      onPasswordChangeSuccess?.();
    } catch (error) {
      const apiMessage = isAxiosError<ApiErrorBody>(error) ? error.response?.data?.message : undefined;
      toast.error(apiMessage || "Password change failed");
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(handlePasswordChange)} className="grid max-w-md gap-5">
      <FormField id="change_password_oldpassword" label="Old Password" required error={errors.oldpassword?.message}>
        <PasswordInput autoComplete="current-password" {...register("oldpassword")} />
      </FormField>
      <FormField id="change_password_password" label="Password" required error={errors.password?.message}>
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
      <Button type="submit" size="lg" className="w-full">
        Change Password
      </Button>
    </form>
  );
};

export default ChangePasswordForm;
