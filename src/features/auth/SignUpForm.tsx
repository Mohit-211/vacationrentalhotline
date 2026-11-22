"use client";

import { useState } from "react";
import Link from "next/link";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PhoneInput } from "@/components/ui/PhoneInput";
import StatusMessage from "@/components/ui/StatusMessage";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { PASSWORD_HINT, passwordSchema } from "@/lib/schemas/password";
import { isEmail, isValidPhone } from "@/lib/validation";
import { AuthCard, authLinkClasses } from "./AuthCard";

const schema = z
  .object({
    name: z.string().min(1, "Please input your name!"),
    email: z.string().min(1, "Please input your email!").refine(isEmail, "Please input your email!"),
    mobile: z.string().min(1, "Please input your mobile!").refine(isValidPhone, "Invalid phone number."),
    password: z.string().min(1, "Please input your password!").pipe(passwordSchema),
    confirm_password: z.string().min(1, "Please confirm your password!"),
    terms: z.boolean().refine((accepted) => accepted, "Should accept terms and conditions"),
  })
  .refine((values) => !values.confirm_password || values.password === values.confirm_password, {
    path: ["confirm_password"],
    message: "The two passwords do not match!",
  });
type SignUpValues = z.infer<typeof schema>;

const emptyForm: SignUpValues = {
  name: "",
  email: "",
  mobile: "",
  password: "",
  confirm_password: "",
  terms: false,
};

const SignUpForm = () => {
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string>();
  const [verificationSent, setVerificationSent] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SignUpValues>({ resolver: zodResolver(schema), mode: "onChange", defaultValues: emptyForm });
  const termsAccepted = useWatch({ control, name: "terms" });

  const handleSignUp = async (values: SignUpValues) => {
    setLoading(true);
    // Better Auth emails the verification link; no session until it's used.
    const { error } = await authClient.signUp.email({
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
      phone: values.mobile,
    });
    setLoading(false);
    if (error) {
      toast.error(authErrorMessage(error));
      return;
    }
    reset(emptyForm);
    setSubmittedEmail(values.email.trim());
    setVerificationSent(true);
  };

  if (verificationSent) {
    return (
      <StatusMessage
        subject="Almost there! Verify Your Email"
        text={
          <>
            We&apos;ve sent a verification link to the email address you provided: <strong>{submittedEmail}</strong>.
            Please click the link in the email to verify your email address and complete the sign-up process. If the
            email address above is incorrect, please Sign Up Again to create a new account with the correct email.
          </>
        }
        buttonText="Create New Account"
        onButtonClick={() => setVerificationSent(false)}
        showLoginLink
      />
    );
  }

  return (
    <AuthCard
      title="Create an Account"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className={authLinkClasses}>
            Login
          </Link>
        </>
      }
    >
      <form method="post" noValidate onSubmit={handleSubmit(handleSignUp)} className="grid gap-5">
        <FormField id="signup_name" label="Name" required error={errors.name?.message}>
          <Input placeholder="Enter Name" autoComplete="name" {...register("name")} />
        </FormField>
        <FormField id="signup_email" label="Email" required error={errors.email?.message}>
          <Input type="email" placeholder="Enter Email" autoComplete="email" {...register("email")} />
        </FormField>
        <Controller
          control={control}
          name="mobile"
          render={({ field }) => (
            <FormField id="signup_mobile" label="Mobile" required error={errors.mobile?.message}>
              <PhoneInput
                placeholder="Enter Mobile Number"
                defaultCountry="US"
                countries={["US", "CA"]}
                value={field.value}
                onChange={(value) => field.onChange(value ?? "")}
                onBlur={field.onBlur}
              />
            </FormField>
          )}
        />
        <FormField id="signup_password" label="Password" required hint={PASSWORD_HINT} error={errors.password?.message}>
          <PasswordInput
            placeholder="*****"
            autoComplete="new-password"
            {...register("password", { deps: ["confirm_password"] })}
          />
        </FormField>
        <FormField
          id="signup_confirm_password"
          label="Confirm Password"
          required
          error={errors.confirm_password?.message}
        >
          <PasswordInput placeholder="*****" autoComplete="new-password" {...register("confirm_password")} />
        </FormField>
        <div className="grid gap-1.5">
          <div className="flex items-start gap-3">
            <Controller
              control={control}
              name="terms"
              render={({ field }) => (
                <Checkbox
                  id="signup_terms"
                  className="mt-0.5"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  aria-invalid={errors.terms ? true : undefined}
                  aria-describedby={errors.terms ? "signup_terms-error" : undefined}
                />
              )}
            />
            <label htmlFor="signup_terms" className="text-sm leading-snug">
              I have read the{" "}
              {/* A new tab, so leaving to read them doesn't lose the form. */}
              <Link href="/terms" target="_blank" rel="noopener noreferrer" className={authLinkClasses}>
                terms and conditions
              </Link>
            </label>
          </div>
          {errors.terms && (
            <p id="signup_terms-error" className="text-sm text-danger">
              {errors.terms.message}
            </p>
          )}
        </div>
        <Button type="submit" size="lg" loading={loading} disabled={!termsAccepted} className="w-full">
          Create Account
        </Button>
      </form>
    </AuthCard>
  );
};

export default SignUpForm;
