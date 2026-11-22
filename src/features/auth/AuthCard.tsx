import type { ReactNode } from "react";

interface AuthCardProps {
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

/** The card every sign-in, sign-up and password screen sits in. */
export function AuthCard({ title, description, footer, children }: AuthCardProps) {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-lg sm:p-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <div className="mt-2 text-sm text-muted-foreground">{description}</div>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
    </div>
  );
}

export const authLinkClasses = "font-semibold text-primary-strong hover:text-primary-stronger hover:underline";
