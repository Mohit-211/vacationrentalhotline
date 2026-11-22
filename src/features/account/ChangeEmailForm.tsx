"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { isEmail } from "@/lib/validation";

const schema = z.object({
  email: z.string().min(1, "Please input your new email!").refine(isEmail, "Please enter a valid email!"),
});
type ChangeEmailValues = z.infer<typeof schema>;

const ChangeEmailForm = ({ onEmailChangeSuccess }: { onEmailChangeSuccess: () => void }) => {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangeEmailValues>({ resolver: zodResolver(schema), mode: "onChange", defaultValues: { email: "" } });

  const handleEmailChange = async (values: ChangeEmailValues) => {
    setLoading(true);
    // Emails a confirmation link to the new address; the email changes once it's opened.
    const { error } = await authClient.changeEmail({ newEmail: values.email.trim(), callbackURL: "/account" });
    setLoading(false);
    if (error) {
      toast.error(authErrorMessage(error));
      return;
    }
    toast.success("Verification email sent to new address.");
    onEmailChangeSuccess();
  };

  return (
    <form method="post" noValidate onSubmit={handleSubmit(handleEmailChange)} className="grid max-w-md gap-5">
      <FormField id="change_email_email" label="New Email" required error={errors.email?.message}>
        <Input type="email" placeholder="Enter your new email" autoComplete="email" {...register("email")} />
      </FormField>
      <Button type="submit" size="lg" loading={loading} className="w-full">
        Update Email
      </Button>
    </form>
  );
};

export default ChangeEmailForm;
