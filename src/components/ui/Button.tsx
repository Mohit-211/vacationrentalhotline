import type { ComponentProps, MouseEvent } from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

const filledDisabled =
  "disabled:bg-surface-muted disabled:text-muted-foreground disabled:shadow-none aria-disabled:bg-surface-muted aria-disabled:text-muted-foreground aria-disabled:shadow-none";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-colors select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed aria-disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: cn("bg-primary-strong text-on-strong shadow-xs hover:bg-primary-stronger", filledDisabled),
        secondary: cn("bg-secondary-strong text-on-strong shadow-xs hover:bg-secondary-stronger", filledDisabled),
        outline: cn(
          "border border-input bg-surface text-foreground shadow-xs hover:bg-surface-muted",
          filledDisabled,
          "disabled:border-border"
        ),
        ghost: "text-foreground hover:bg-surface-muted disabled:text-muted-foreground",
        link: "h-auto px-0 text-primary-strong underline-offset-4 hover:text-primary-stronger hover:underline disabled:text-muted-foreground",
        danger: cn("bg-danger text-on-strong shadow-xs hover:bg-danger-strong", filledDisabled),
        /** For use on strong brand-coloured backgrounds. */
        inverse: cn("bg-surface text-primary-stronger shadow-sm hover:bg-primary-soft", filledDisabled),
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element (e.g. a Link) with button styles. */
    asChild?: boolean;
    /** Shows a spinner and ignores clicks until the action finishes. */
    loading?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  onClick,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (asChild) {
    return (
      <Slot.Root data-slot="button" className={classes} {...props}>
        {children}
      </Slot.Root>
    );
  }

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      data-slot="button"
      className={classes}
      aria-busy={loading || undefined}
      onClick={handleClick}
      {...props}
    >
      {loading && <Spinner label="Working" />}
      {children}
    </button>
  );
}
