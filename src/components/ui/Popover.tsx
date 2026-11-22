"use client";

import type { ComponentProps } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

export function PopoverContent({
  className,
  align = "start",
  sideOffset = 6,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 origin-(--radix-popover-content-transform-origin) rounded-lg border border-border bg-surface p-4 text-foreground shadow-lg outline-none data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
