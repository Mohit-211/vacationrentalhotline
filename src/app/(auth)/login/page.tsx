import { redirect } from "next/navigation";
import LoginForm from "@/features/auth/LoginForm";
import { currentCustomer } from "@/server/session";

export default async function LoginPage() {
  // A customer already signed in has nothing to do here.
  if (await currentCustomer()) redirect("/dashboard");
  return <LoginForm />;
}
