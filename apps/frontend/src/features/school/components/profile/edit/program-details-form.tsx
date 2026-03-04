import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DIVISIONS } from "@/utils/constants/divisions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { schoolQueries } from "../../../api/queries";
import { schemas } from "../../../api/schemas";

export type ProgramDetailsFormData = z.infer<
  typeof schemas.updateProgramDetails
>;

const CIRCUIT_OPTIONS = [
  { value: "uda", label: "UDA" },
  { value: "dtu", label: "DTU" },
  { value: "nda", label: "NDA" },
  { value: "usa", label: "USA" },
  { value: "non-competitive", label: "Non-Competitive" },
  { value: "other", label: "Other" },
] as const;

const SELECTION_OPTIONS = [
  { value: "recruitment", label: "Recruitment" },
  { value: "audition", label: "Audition" },
  { value: "hybrid", label: "Hybrid" },
] as const;

const DIVISION_OPTIONS = Object.entries(DIVISIONS).map(([value, label]) => ({
  value,
  label,
}));

interface ProgramDetailsFormProps {
  username: string;
  onSubmit: (data: ProgramDetailsFormData) => void;
}

export function ProgramDetailsForm({
  username,
  onSubmit,
}: ProgramDetailsFormProps) {
  const { data } = useSuspenseQuery(schoolQueries.profile(username));

  const form = useForm({
    resolver: zodResolver(schemas.updateProgramDetails),
    defaultValues: {
      gpa: data.gpa ?? undefined,
      teamSelection: data.teamSelection,
      competitiveCircuit: data.competitiveCircuit,
      division: data.division ?? undefined,
    },
  });

  return (
    <FormProvider {...form}>
      <form
        id="edit-program-details-form"
        className="flex w-full flex-col gap-3"
        onSubmit={(e) => form.handleSubmit(onSubmit)(e)}
      >
        <div className="grid grid-cols-2 gap-3">
          <Controller
            control={form.control}
            name="competitiveCircuit"
            render={({ field: { value, onChange }, fieldState }) => (
              <Field name="competitiveCircuit" invalid={fieldState.invalid}>
                <FieldLabel>Competitive Circuit</FieldLabel>
                <Select
                  value={value}
                  onValueChange={onChange}
                  items={CIRCUIT_OPTIONS}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CIRCUIT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError error={fieldState.error} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="teamSelection"
            render={({ field: { value, onChange }, fieldState }) => (
              <Field name="teamSelection" invalid={fieldState.invalid}>
                <FieldLabel>Team Selection</FieldLabel>
                <Select
                  value={value}
                  onValueChange={onChange}
                  items={SELECTION_OPTIONS}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SELECTION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError error={fieldState.error} />
              </Field>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Controller
            control={form.control}
            name="division"
            render={({ field: { value, onChange }, fieldState }) => (
              <Field name="division" invalid={fieldState.invalid}>
                <FieldLabel>Division</FieldLabel>
                <Select
                  value={value ?? undefined}
                  onValueChange={onChange}
                  items={DIVISION_OPTIONS}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select division..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DIVISION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError error={fieldState.error} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="gpa"
            render={({ field: { value, onChange }, fieldState }) => (
              <Field name="gpa" invalid={fieldState.invalid}>
                <FieldLabel>Required GPA</FieldLabel>
                <NumberField
                  value={value as number | undefined}
                  onValueChange={(val) => onChange(val)}
                  min={0}
                  max={5}
                  step={0.1}
                >
                  <NumberFieldGroup>
                    <NumberFieldDecrement />
                    <NumberFieldInput placeholder="GPA" />
                    <NumberFieldIncrement />
                  </NumberFieldGroup>
                </NumberField>
                <FieldError error={fieldState.error} />
              </Field>
            )}
          />
        </div>
      </form>
    </FormProvider>
  );
}
