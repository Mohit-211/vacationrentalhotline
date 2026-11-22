"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { requestEmailChange } from "@/lib/api/auth";
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
    const formData = {
      newEmail: values.email,
    };

    setLoading(true);

    try {
      const response = await requestEmailChange(formData);
      if (response?.data?.message) {
        toast.success(response.data.message || "Email updated successfully");
        onEmailChangeSuccess();
      } else {
        toast.error("Failed to update email. Please try again.");
      }
    } catch (error) {
      console.error("Error updating email:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(handleEmailChange)} className="grid max-w-md gap-5">
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
