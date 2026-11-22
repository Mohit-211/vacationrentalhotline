"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { AuthCard, authLinkClasses } from "./AuthCard";

const schema = z.object({
  email: z.string().min(1, "Please input your Email!"),
  password: z.string().min(1, "Please input your password!"),
});
type LoginValues = z.infer<typeof schema>;

const LoginForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    setLoading(true);
    // Better Auth sets the httpOnly session cookie on success.
    const { error } = await authClient.signIn.email({ email: values.email.trim(), password: values.password });
    setLoading(false);
    if (error) {
      toast.error(authErrorMessage(error));
      return;
    }
    toast.success("Successfully Logged in.");
    router.push("/dashboard");
  };

  return (
    <AuthCard
      title="Login"
      description={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className={authLinkClasses}>
            Sign up
          </Link>
        </>
      }
    >
      <form method="post" noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
        <FormField id="loginForm_email" label="Email" required error={errors.email?.message}>
          <Input placeholder="Enter Email Address" autoComplete="email" {...register("email")} />
        </FormField>
        <FormField id="loginForm_password" label="Password" required error={errors.password?.message}>
          <PasswordInput placeholder="*****" autoComplete="current-password" {...register("password")} />
        </FormField>
        <div className="-mt-2 text-right text-sm">
          <Link href="/forgot-password" className={authLinkClasses}>
            Forgot Password
          </Link>
        </div>
        <Button type="submit" size="lg" loading={loading} className="w-full">
          Sign In
        </Button>
      </form>
    </AuthCard>
  );
};

export default LoginForm;
