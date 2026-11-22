import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Shared look for text inputs, textareas, selects and comboboxes. */
export const controlStyles =
  "w-full min-w-0 rounded-lg border border-input bg-surface px-3 text-base text-foreground shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-1 focus-visible:outline-offset-0 focus-visible:outline-ring disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted-foreground aria-invalid:border-danger aria-invalid:focus-visible:outline-danger md:text-sm";

export function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(controlStyles, "h-10 py-2", className)}
      {...props}
    />
  );
}
