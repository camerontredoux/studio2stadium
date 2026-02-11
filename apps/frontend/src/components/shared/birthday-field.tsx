import { Controller, useFormContext, useFormState } from "react-hook-form";
import { Field } from "../ui/field";
import { Label } from "../ui/label";
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
} from "../ui/number-field";
import { MonthSelect } from "./month-select";

type BirthdayFieldProps = {
  name: string;
};

export function BirthdayField({ name }: BirthdayFieldProps) {
  const { control, trigger } = useFormContext();
  const { errors } = useFormState({ control });

  const fieldError = errors[name] as
    | { root?: { message?: string }; message?: string }
    | undefined;
  const errorMessage = fieldError?.root?.message ?? fieldError?.message;

  return (
    <div className="flex flex-col gap-2">
      <Label>Birth Date</Label>
      <div className="grid grid-cols-4 items-center gap-2">
        <Controller
          control={control}
          name={`${name}.month`}
          render={({ field, fieldState }) => (
            <Field
              className="col-span-2"
              name={field.name}
              invalid={fieldState.invalid}
            >
              <MonthSelect
                value={field.value}
                onChange={(value) => {
                  field.onChange(value ? Number(value) : null);
                  trigger(name);
                }}
              />
            </Field>
          )}
        />
        <Controller
          control={control}
          name={`${name}.day`}
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <NumberField
                max={31}
                min={1}
                value={field.value ?? null}
                onValueChange={(value) => {
                  field.onChange(value);
                  trigger(name);
                }}
              >
                <NumberFieldGroup>
                  <NumberFieldInput
                    placeholder="Day"
                    inputMode="numeric"
                    maxLength={2}
                  />
                </NumberFieldGroup>
              </NumberField>
            </Field>
          )}
        />
        <Controller
          control={control}
          name={`${name}.year`}
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <NumberField
                format={{ useGrouping: false }}
                max={new Date().getFullYear()}
                min={new Date().getFullYear() - 100}
                value={field.value ?? null}
                onValueChange={(value) => {
                  field.onChange(value);
                  trigger(name);
                }}
              >
                <NumberFieldGroup>
                  <NumberFieldInput
                    inputMode="numeric"
                    maxLength={4}
                    minLength={4}
                    placeholder="Year"
                  />
                </NumberFieldGroup>
              </NumberField>
            </Field>
          )}
        />
      </div>
      {errorMessage && (
        <p className="text-destructive text-xs">{errorMessage as string}</p>
      )}
    </div>
  );
}
