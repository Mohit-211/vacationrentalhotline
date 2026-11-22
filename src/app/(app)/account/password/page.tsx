import ChangePasswordForm from "@/features/account/ChangePasswordForm";

export default function AccountPasswordPage() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <h1 className="mb-6 text-2xl font-bold">Change Password</h1>
      <ChangePasswordForm />
    </div>
  );
}
