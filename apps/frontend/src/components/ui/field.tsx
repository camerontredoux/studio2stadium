import { Field as FieldPrimitive } from "@base-ui/react/field";

import { cn } from "@/components/utils/cn";
import { cva, type VariantProps } from "class-variance-authority";
import type { FieldError as FieldErrorType } from "react-hook-form";

const fieldVariants = cva(
  "data-[invalid=true]:text-destructive gap-2 group/field flex w-full",
  {
    variants: {
      orientation: {
        vertical: "flex-col [&>*]:w-full [&>.sr-only]:w-auto",
        horizontal:
          "flex-row items-center [&>[data-slot=field-label]]:flex-auto has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        responsive:
          "flex-col [&>*]:w-full [&>.sr-only]:w-auto @sm/field-group:flex-row @sm/field-group:items-center @sm/field-group:[&>*]:w-auto @sm/field-group:[&>[data-slot=field-label]]:flex-auto @sm/field-group:has-[>[data-slot=field-content]]:items-start @sm/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  },
);

function Field({
  className,
  orientation,
  ...props
}: FieldPrimitive.Root.Props & VariantProps<typeof fieldVariants>) {
  return (
    <FieldPrimitive.Root
      className={cn(fieldVariants({ orientation }), className)}
      data-slot="field"
      data-orientation={orientation}
      data-invalid={props.invalid || undefined}
      {...props}
    />
  );
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "group/field-group @container/field-group flex w-full flex-col gap-7 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4",
        className,
      )}
      {...props}
    />
  );
}

function FieldLabel({ className, ...props }: FieldPrimitive.Label.Props) {
  return (
    <FieldPrimitive.Label
      className={cn(
        "inline-flex items-center gap-2 font-medium text-sm/4",
        className,
      )}
      data-slot="field-label"
      {...props}
    />
  );
}

function FieldDescription({
  className,
  ...props
}: FieldPrimitive.Description.Props) {
  return (
    <FieldPrimitive.Description
      className={cn("text-muted-foreground text-xs", className)}
      data-slot="field-description"
      {...props}
    />
  );
}

function FieldError({
  className,
  error,
  ...props
}: FieldPrimitive.Error.Props & { error?: FieldErrorType | undefined }) {
  return (
    <FieldPrimitive.Error
      className={cn("text-destructive text-xs", className)}
      data-slot="field-error"
      match={!!error}
      {...props}
    >
      {error?.message}
    </FieldPrimitive.Error>
  );
}

const FieldControl = FieldPrimitive.Control;
const FieldValidity = FieldPrimitive.Validity;

export {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldValidity,
};
