import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Joins class names; a later Tailwind class overrides an earlier one. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * "Nov 22, 2027", in the viewer's own time zone. For values loaded in the
 * browser: rendered on the server, it would use the server's time zone.
 */
export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
