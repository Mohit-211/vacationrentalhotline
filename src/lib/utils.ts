import type { CSSProperties } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Joins class names; a later Tailwind class overrides an earlier one. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Inline style for a [data-reveal] element's place in a staggered group (0, 1, 2, ...). */
export const revealOrder = (order: number) => ({ "--reveal-order": order }) as CSSProperties;
