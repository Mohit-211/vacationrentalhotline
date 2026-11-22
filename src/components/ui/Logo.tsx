import Image from "next/image";
import logoWordmark from "@public/logo.png";
import logoMark from "@public/logo-mark.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** "wordmark": shield plus name; "mark": the shield alone. */
  variant?: "wordmark" | "mark";
  className?: string;
  priority?: boolean;
}

export function Logo({ variant = "wordmark", className, priority }: LogoProps) {
  return (
    <Image
      src={variant === "mark" ? logoMark : logoWordmark}
      alt="Vacation Rental Hotline"
      priority={priority}
      className={cn("h-10 w-auto", className)}
    />
  );
}
