import { Controller, useFormContext } from "react-hook-form";
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
  const { control } = useFormContext();

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
              <MonthSelect value={field.value} onChange={field.onChange} />
            </Field>
          )}
        />
        <Controller
          control={control}
          name={`${name}.day`}
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <NumberField max={31} min={1}>
                <NumberFieldGroup>
                  <NumberFieldInput
                    placeholder="Day"
                    inputMode="numeric"
                    maxLength={2}
                    value={field.value ?? ""}
                    onChange={field.onChange}
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
              >
                <NumberFieldGroup>
                  <NumberFieldInput
                    inputMode="numeric"
                    maxLength={4}
                    minLength={4}
                    placeholder="Year"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                </NumberFieldGroup>
              </NumberField>
            </Field>
          )}
        />
      </div>
    </div>
  );
}
