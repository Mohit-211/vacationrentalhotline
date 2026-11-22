import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "flex gap-3 rounded-lg border p-4 text-sm [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        info: "border-primary/40 bg-primary-soft text-foreground [&_svg]:text-primary-strong",
        success: "border-secondary/40 bg-secondary-soft text-foreground [&_svg]:text-secondary-strong",
        warning: "border-warning/30 bg-warning-soft text-foreground [&_svg]:text-warning",
        danger: "border-danger/30 bg-danger-soft text-danger [&_svg]:text-danger",
      },
    },
    defaultVariants: { variant: "info" },
  }
);

/** Inline message box for info, success, warning or error text. */
export function Alert({
  className,
  variant,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}
