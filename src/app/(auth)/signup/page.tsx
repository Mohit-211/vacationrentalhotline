import { redirect } from "next/navigation";
import SignUpForm from "@/features/auth/SignUpForm";
import { currentCustomer } from "@/server/session";

export default async function SignUpPage() {
  // A customer already signed in has nothing to do here.
  if (await currentCustomer()) redirect("/dashboard");
  return <SignUpForm />;
}
