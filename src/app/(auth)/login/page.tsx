import { redirect } from "next/navigation";
import LoginForm from "@/features/auth/LoginForm";
import { currentSession } from "@/server/session";

export default async function LoginPage() {
  // Someone already signed in has nothing to do here.
  if (await currentSession()) redirect("/dashboard");
  return <LoginForm />;
}
