"use client";

import type { CSSProperties } from "react";
import { Toaster as Sonner } from "sonner";

// Toast colours come from the globals.css tokens; every pair passes 4.5:1.
const toastTheme = {
  fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  "--border-radius": "0.5rem",
  "--normal-bg": "var(--color-surface)",
  "--normal-text": "var(--color-foreground)",
  "--normal-border": "var(--color-border)",
  "--success-bg": "var(--color-secondary-soft)",
  "--success-text": "var(--color-secondary-stronger)",
  "--success-border": "var(--color-border)",
  "--error-bg": "var(--color-danger-soft)",
  "--error-text": "var(--color-danger)",
  "--error-border": "var(--color-border)",
  "--warning-bg": "var(--color-warning-soft)",
  "--warning-text": "var(--color-warning)",
  "--warning-border": "var(--color-border)",
  "--info-bg": "var(--color-primary-soft)",
  "--info-text": "var(--color-primary-stronger)",
  "--info-border": "var(--color-border)",
} as CSSProperties;

/** Toast messages: top-centre for 3 seconds, like the antd messages they replace. */
export function Toaster() {
  return <Sonner position="top-center" duration={3000} richColors style={toastTheme} />;
}
