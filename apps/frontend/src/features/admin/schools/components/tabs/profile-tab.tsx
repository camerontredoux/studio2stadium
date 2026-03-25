import LocationSelect from "@/components/shared/location-select";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast-manager";
import { useAdminUpdateSchoolProfile } from "@/features/admin/api/mutations";
import type { ApiSchemas } from "@/lib/api/client";
import { DIVISIONS } from "@/utils/constants/divisions";
import { zodResolver } from "@hookform/resolvers/zod";
import { forwardRef, useEffect, useImperativeHandle } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import type { TabHandle } from "./types";

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

const profileSchema = z.object({
  schoolName: z.string().optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  about: z.string().optional(),
  missionStatement: z.string().optional(),
  whatWeDo: z.string().optional(),
  benefits: z.string().optional(),
  website: z.string().optional(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  headCoach: z.string().optional(),
  assistantCoach: z.string().optional(),
  timeCommitment: z.string().optional(),
  size: z.coerce.number().optional(),
  gpa: z.coerce.number().optional(),
  division: z.string().optional(),
  teamSelection: z.enum(["recruitment", "audition", "hybrid"]).optional(),
  competitiveCircuit: z
    .enum(["uda", "dtu", "nda", "usa", "non-competitive", "other"])
    .optional(),
  commonRecruiting: z.boolean().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileTabProps {
  username: string;
  data: ApiSchemas["SchoolsIdResponse"];
  onStateChange: (state: { isDirty: boolean; isPending: boolean }) => void;
}

export const ProfileTab = forwardRef<TabHandle, ProfileTabProps>(
  function ProfileTab({ username, data, onStateChange }, ref) {
    const { mutate, isPending } = useAdminUpdateSchoolProfile();

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      schoolName: data.name,
      location: data.location,
      city: data.city ?? "",
      about: data.about ?? "",
      missionStatement: data.missionStatement ?? "",
      whatWeDo: data.whatWeDo ?? "",
      benefits: data.benefits ?? "",
      website: data.website ?? "",
      instagram: data.instagram ?? "",
      tiktok: data.tiktok ?? "",
      headCoach: data.headCoach ?? "",
      assistantCoach: data.assistantCoach ?? "",
      timeCommitment: data.timeCommitment ?? "",
      size: data.size ?? undefined,
      gpa: data.gpa ?? undefined,
      division: data.division ?? "",
      teamSelection: data.teamSelection,
      competitiveCircuit: data.competitiveCircuit,
      commonRecruiting: data.commonRecruiting,
    },
  });

  const onSubmit = (formData: ProfileFormData) => {
    mutate(
      {
        params: { path: { username } },
        body: formData,
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: "Profile updated successfully",
            type: "success",
          });
        },
        onError: () => {
          toastManager.add({
            title: "Error",
            description: "Failed to update profile",
            type: "error",
          });
        },
      },
    );
  };

  useImperativeHandle(ref, () => ({
    save: () => form.handleSubmit(onSubmit)(),
    isDirty: form.formState.isDirty,
    isPending,
  }));

  useEffect(() => {
    onStateChange({ isDirty: form.formState.isDirty, isPending });
  }, [form.formState.isDirty, isPending, onStateChange]);

  return (
    <div className="flex h-full flex-col gap-4">
      <FormProvider {...form}>
        <form
          id="admin-profile-form"
          className="flex-1 space-y-6 overflow-auto pr-2"
          onSubmit={(e) => form.handleSubmit(onSubmit)(e)}
        >
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Basic Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="schoolName"
                render={({ field: { value, ...field }, fieldState }) => (
                  <Field name={field.name} invalid={fieldState.invalid}>
                    <FieldLabel>School Name</FieldLabel>
                    <Input value={value ?? ""} {...field} />
                    <FieldError error={fieldState.error} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="location"
                render={({ field, fieldState }) => (
                  <Field name={field.name} invalid={fieldState.invalid}>
                    <FieldLabel>State</FieldLabel>
                    <LocationSelect
                      value={field.value ?? undefined}
                      onChange={field.onChange}
                    />
                    <FieldError error={fieldState.error} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="city"
                render={({ field: { value, ...field }, fieldState }) => (
                  <Field name={field.name} invalid={fieldState.invalid}>
                    <FieldLabel>City</FieldLabel>
                    <Input value={value ?? ""} {...field} />
                    <FieldError error={fieldState.error} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="division"
                render={({ field, fieldState }) => (
                  <Field name={field.name} invalid={fieldState.invalid}>
                    <FieldLabel>Division</FieldLabel>
                    <Select
                      value={field.value ?? undefined}
                      onValueChange={(value) => field.onChange(value || undefined)}
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
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">About</h3>
            <Controller
              control={form.control}
              name="about"
              render={({ field: { value, ...field }, fieldState }) => (
                <Field name={field.name} invalid={fieldState.invalid}>
                  <FieldLabel>About</FieldLabel>
                  <Textarea value={value ?? ""} {...field} rows={3} />
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
                  <Textarea value={value ?? ""} {...field} rows={2} />
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
                  <Textarea value={value ?? ""} {...field} rows={2} />
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
                  <Textarea value={value ?? ""} {...field} rows={2} />
                  <FieldError error={fieldState.error} />
                </Field>
              )}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Social & Contact</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Controller
                control={form.control}
                name="website"
                render={({ field: { value, ...field }, fieldState }) => (
                  <Field name={field.name} invalid={fieldState.invalid}>
                    <FieldLabel>Website</FieldLabel>
                    <Input value={value ?? ""} {...field} placeholder="https://" />
                    <FieldError error={fieldState.error} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="instagram"
                render={({ field: { value, ...field }, fieldState }) => (
                  <Field name={field.name} invalid={fieldState.invalid}>
                    <FieldLabel>Instagram</FieldLabel>
                    <Input value={value ?? ""} {...field} placeholder="@username" />
                    <FieldError error={fieldState.error} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="tiktok"
                render={({ field: { value, ...field }, fieldState }) => (
                  <Field name={field.name} invalid={fieldState.invalid}>
                    <FieldLabel>TikTok</FieldLabel>
                    <Input value={value ?? ""} {...field} placeholder="@username" />
                    <FieldError error={fieldState.error} />
                  </Field>
                )}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Team Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="headCoach"
                render={({ field: { value, ...field }, fieldState }) => (
                  <Field name={field.name} invalid={fieldState.invalid}>
                    <FieldLabel>Head Coach</FieldLabel>
                    <Input value={value ?? ""} {...field} />
                    <FieldError error={fieldState.error} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="assistantCoach"
                render={({ field: { value, ...field }, fieldState }) => (
                  <Field name={field.name} invalid={fieldState.invalid}>
                    <FieldLabel>Assistant Coach</FieldLabel>
                    <Input value={value ?? ""} {...field} />
                    <FieldError error={fieldState.error} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="size"
                render={({ field: { value, onChange }, fieldState }) => (
                  <Field name="size" invalid={fieldState.invalid}>
                    <FieldLabel>Team Size</FieldLabel>
                    <NumberField
                      value={value as number | undefined}
                      onValueChange={(val) => onChange(val)}
                      min={1}
                    >
                      <NumberFieldGroup>
                        <NumberFieldDecrement />
                        <NumberFieldInput placeholder="Enrollment" />
                        <NumberFieldIncrement />
                      </NumberFieldGroup>
                    </NumberField>
                    <FieldError error={fieldState.error} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="timeCommitment"
                render={({ field: { value, ...field }, fieldState }) => (
                  <Field name={field.name} invalid={fieldState.invalid}>
                    <FieldLabel>Time Commitment</FieldLabel>
                    <Input value={value ?? ""} {...field} />
                    <FieldError error={fieldState.error} />
                  </Field>
                )}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Program Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="gpa"
                render={({ field: { value, onChange }, fieldState }) => (
                  <Field name="gpa" invalid={fieldState.invalid}>
                    <FieldLabel>Minimum GPA</FieldLabel>
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
              <Controller
                control={form.control}
                name="teamSelection"
                render={({ field, fieldState }) => (
                  <Field name={field.name} invalid={fieldState.invalid}>
                    <FieldLabel>Team Selection</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value || undefined)}
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
                render={({ field, fieldState }) => (
                  <Field name={field.name} invalid={fieldState.invalid}>
                    <FieldLabel>Competitive Circuit</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value || undefined)}
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
          </div>
        </form>
      </FormProvider>
    </div>
  );
});
