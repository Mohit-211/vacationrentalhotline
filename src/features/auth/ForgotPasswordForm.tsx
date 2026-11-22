"use client";

import { useState } from "react";
import { MailCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { isEmail } from "@/lib/validation";
import { AuthCard } from "./AuthCard";

const schema = z.object({
  email: z.string().min(1, "Please input your email!").refine(isEmail, "Please enter a valid email!"),
});
type ForgotPasswordValues = z.infer<typeof schema>;

const ForgotPasswordForm = () => {
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(schema), mode: "onChange", defaultValues: { email: "" } });

  const handleSendLink = async (values: ForgotPasswordValues) => {
    setLoading(true);
    // The emailed link checks the token, then opens /reset-password?token=...
    const { error } = await authClient.requestPasswordReset({
      email: values.email.trim(),
      redirectTo: "/reset-password",
    });
    setLoading(false);
    if (error) {
      toast.error(authErrorMessage(error));
      return;
    }
    setLinkSent(true);
  };

  if (linkSent) {
    return (
      <AuthCard title="Check Your Mail">
        <div className="flex items-start gap-3 rounded-lg bg-primary-soft p-4 text-sm">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-primary-strong" aria-hidden="true" />
          <p>If an account uses this email, we&apos;ve sent a password recovery link to it. The link works for 1 hour.</p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot Password"
      description="Enter the email you signed up with and we’ll send you a link to reset your password."
    >
      <form method="post" noValidate autoComplete="off" onSubmit={handleSubmit(handleSendLink)} className="grid gap-5">
        <FormField id="forgot_email" label="Email" required error={errors.email?.message}>
          <Input type="email" placeholder="example123@gmail.com" {...register("email")} />
        </FormField>
        <Button type="submit" size="lg" loading={loading} className="w-full">
          {loading ? "Sending..." : "Submit"}
        </Button>
      </form>
    </AuthCard>
  );
};

export default ForgotPasswordForm;
