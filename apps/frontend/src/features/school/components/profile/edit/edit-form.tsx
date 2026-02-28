import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DIVISIONS } from "@/utils/constants/divisions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { schoolQueries } from "../../../api/queries";
import { schemas } from "../../../api/schemas";

export type EditFormData = z.infer<typeof schemas.updateAbout>;

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

interface EditFormProps {
  username: string;
  onSubmit: (data: EditFormData) => void;
}

export function EditForm({ username, onSubmit }: EditFormProps) {
  const { data } = useSuspenseQuery(schoolQueries.profile(username));

  const form = useForm({
    resolver: zodResolver(schemas.updateAbout),
    defaultValues: {
      about: data.about ?? "",
      missionStatement: data.missionStatement ?? "",
      whatWeDo: data.whatWeDo ?? "",
      benefits: data.benefits ?? "",
      teamSelection: data.teamSelection,
      competitiveCircuit: data.competitiveCircuit,
      division: data.division ?? undefined,
    },
  });

  return (
    <FormProvider {...form}>
      <form
        id="edit-about-form"
        className="flex w-full flex-col gap-3"
        onSubmit={(e) => form.handleSubmit(onSubmit)(e)}
      >
        <Controller
          control={form.control}
          name="about"
          render={({ field: { value, ...field }, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>About</FieldLabel>
              <Textarea
                value={value as string}
                {...field}
                rows={4}
                placeholder="Tell us about your dance program..."
              />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="missionStatement"
          render={({ field: { value, ...field }, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Mission Statement</FieldLabel>
              <Textarea
                value={value as string}
                {...field}
                rows={3}
                placeholder="Your program's mission statement..."
              />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="whatWeDo"
          render={({ field: { value, ...field }, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>What We Do</FieldLabel>
              <Textarea
                value={value as string}
                {...field}
                rows={3}
                placeholder="Describe what your program does..."
              />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="benefits"
          render={({ field: { value, ...field }, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Benefits</FieldLabel>
              <Textarea
                value={value as string}
                {...field}
                rows={3}
                placeholder="Benefits of joining your program..."
              />
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
        <div className="grid grid-cols-2 gap-3">
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
        </div>
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
      </form>
    </FormProvider>
  );
}
