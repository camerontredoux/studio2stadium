import type * as React from "react";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/components/utils/cn";

// The border sits on components/ui's wrapping span, so the input is 30px inside a 32px control.
export const inputControl =
  "rounded-(--radius-6) border-line-control bg-bg-300 dark:bg-bg-300 text-fg shadow-none before:hidden transition-[border-color] " +
  "has-focus-visible:border-line-focus has-focus-visible:ring-0 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-fg " +
  "has-aria-invalid:border-danger has-focus-visible:has-aria-invalid:border-danger has-focus-visible:has-aria-invalid:ring-0 dark:has-aria-invalid:ring-0 has-disabled:opacity-35 " +
  "[&_input]:h-[30px] [&_input]:leading-[30px] [&_input]:px-[9px] [&_input]:s2s-input-size [&_input]:placeholder:text-fg-3";

type SheetFieldProps = Omit<InputProps, "size" | "unstyled" | "onChange"> & {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
  /** Mono text, for bibs and numbers. */
  mono?: boolean;
  /** Classes for the field wrapper (width). */
  className?: string;
};

type SheetFieldFrameProps = {
  label: string;
  error?: string;
  /** Something small after the label, e.g. a "Clear" button. */
  aside?: React.ReactNode;
  /** Classes for the field wrapper (width). */
  className?: string;
  children: React.ReactNode;
};

/**
 * The label, control and validation message of a sheet field, for controls
 * other than a text input (pickers, selects, a textarea).
 */
export function SheetFieldFrame({
  label,
  error,
  aside,
  className,
  children,
}: SheetFieldFrameProps) {
  const fieldLabel = (
    <FieldLabel className="type-body text-fg-2 font-normal">{label}</FieldLabel>
  );
  return (
    <Field
      invalid={!!error}
      className={cn("min-w-0 gap-(--space-6)", className)}
    >
      {aside ? (
        <div className="flex items-center justify-between gap-(--space-8)">
          {fieldLabel}
          {aside}
        </div>
      ) : (
        fieldLabel
      )}
      {children}
      <FieldError
        className="type-caption text-danger"
        error={error ? { type: "validate", message: error } : undefined}
      />
    </Field>
  );
}

/** A labelled 32px S2S text input with its validation message underneath. */
export function SheetField({
  label,
  value,
  onValueChange,
  error,
  mono = false,
  className,
  ...props
}: SheetFieldProps) {
  return (
    <SheetFieldFrame label={label} error={error} className={className}>
      <Input
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onValueChange(e.target.value)
        }
        className={cn(
          inputControl,
          mono && "[&_input]:font-mono [&_input]:tabular-nums",
        )}
        {...props}
      />
    </SheetFieldFrame>
  );
}
