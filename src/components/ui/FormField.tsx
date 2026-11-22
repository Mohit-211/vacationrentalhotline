import { cloneElement, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Label } from "./Label";

type ControlProps = {
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  "aria-required"?: boolean;
};

interface FormFieldProps {
  /** Id of the control; the label and messages are linked to it. */
  id: string;
  label?: ReactNode;
  /** Marks the label with an asterisk, as the old forms did. */
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  className?: string;
  children: ReactElement<ControlProps>;
}

/** Label, control and validation message for one form field. */
export function FormField({ id, label, required, error, hint, className, children }: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div data-slot="form-field" className={cn("grid content-start gap-1.5", className)}>
      {label && (
        <Label htmlFor={id}>
          {required && (
            <span aria-hidden="true" className="text-danger">
              *
            </span>
          )}
          {label}
        </Label>
      )}
      {cloneElement(children, {
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
        "aria-required": required || undefined,
      })}
      {hint && !error && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
