"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { CircleCheck, Clock, MailCheck } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

const tones = {
  success: { icon: CircleCheck, classes: "bg-secondary-soft text-secondary-strong" },
  info: { icon: MailCheck, classes: "bg-primary-soft text-primary-strong" },
  warning: { icon: Clock, classes: "bg-warning-soft text-warning" },
};

interface StatusMessageProps {
  subject: string;
  /** The message; may contain markup such as <strong>, as React elements. */
  text: ReactNode;
  buttonText: string;
  onButtonClick?: () => void;
  tone?: keyof typeof tones;
  /** Adds a "Go to Login" line under the button. */
  showLoginLink?: boolean;
  children?: ReactNode;
}

/** Full-card message for confirmations, verification steps and expired links. */
const StatusMessage = ({
  subject,
  text,
  buttonText,
  onButtonClick,
  tone = "info",
  showLoginLink = false,
}: StatusMessageProps) => {
  const { icon: Icon, classes } = tones[tone];
  return (
    <div className="flex w-full justify-center py-6">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-8 text-center shadow-lg sm:p-10">
        <div className={cn("mx-auto flex size-14 items-center justify-center rounded-full", classes)}>
          <Icon className="size-7" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">{subject}</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground [&_strong]:font-semibold [&_strong]:text-foreground">
          {text}
        </p>
        <Button size="lg" className="mt-8" onClick={onButtonClick}>
          {buttonText}
        </Button>
        {showLoginLink && (
          <p className="mt-6 text-sm text-muted-foreground">
            Go to{" "}
            <Link href="/login" className="font-semibold text-primary-strong hover:text-primary-stronger hover:underline">
              Login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default StatusMessage;
