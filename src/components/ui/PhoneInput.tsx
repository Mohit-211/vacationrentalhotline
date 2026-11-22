"use client";

import type { ComponentProps } from "react";
import PhoneNumberInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";

type PhoneInputProps = ComponentProps<typeof PhoneNumberInput> & {
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  "aria-required"?: boolean;
};

/** Phone number field with a country picker, styled like the other inputs. */
export function PhoneInput({
  className,
  id,
  "aria-invalid": invalid,
  "aria-describedby": describedBy,
  "aria-required": required,
  ...props
}: PhoneInputProps) {
  return (
    <PhoneNumberInput
      // Flags come from this site, not the library's default (a GitHub Pages
      // host every visitor would contact). The forms offer only the US and
      // Canada; their flags are in public/assets/flags, copied from
      // country-flag-icons (MIT, (c) 2020 @catamphetamine), the set the
      // library uses. A form offering another country needs its file there.
      flagUrl="/assets/flags/{XX}.svg"
      {...props}
      className={cn(
        "flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-surface px-3 shadow-xs transition-colors focus-within:border-ring focus-within:outline-1 focus-within:outline-ring",
        invalid && "border-danger focus-within:outline-danger",
        className
      )}
      numberInputProps={{
        id,
        "aria-invalid": invalid,
        "aria-describedby": describedBy,
        "aria-required": required,
        className:
          "h-full min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground md:text-sm",
      }}
    />
  );
}
