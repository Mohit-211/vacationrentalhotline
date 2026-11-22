import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Grey placeholder shown while content loads. */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-surface-muted", className)}
      {...props}
    />
  );
}
