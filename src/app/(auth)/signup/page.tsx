import { redirect } from "next/navigation";
import SignUpForm from "@/features/auth/SignUpForm";
import { currentSession } from "@/server/session";

export default async function SignUpPage() {
  // Someone already signed in has nothing to do here.
  if (await currentSession()) redirect("/dashboard");
  return <SignUpForm />;
}
