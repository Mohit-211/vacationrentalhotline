import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Vertical rhythm for a landing-page section. */
export function Section({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("py-16 sm:py-20 lg:py-24", className)} {...props} />;
}

interface SectionHeadingProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
  /** h1 for a page's main title, h2 for sections. */
  as?: "h1" | "h2";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  as: Heading = "h2",
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p className="mb-3 text-sm font-semibold tracking-wider text-primary-strong uppercase">{eyebrow}</p>
      )}
      <Heading className="text-3xl leading-tight font-bold sm:text-4xl">{title}</Heading>
      {description && <div className="mt-4 text-lg leading-relaxed text-muted-foreground">{description}</div>}
    </div>
  );
}
