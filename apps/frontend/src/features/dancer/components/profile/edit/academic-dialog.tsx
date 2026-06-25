import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { useUpdateProfile } from "@/features/dancer/api/mutations";
import { dancerQueries } from "@/features/dancer/api/queries";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PencilIcon } from "lucide-react";
import * as React from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

const academicSchema = z.object({
  gpa: z.coerce.number().optional(),
  gradYear: z.coerce.number().optional(),
});

type AcademicFormData = z.infer<typeof academicSchema>;

export function AcademicDialog({ username }: { username: string }) {
  const [open, setOpen] = React.useState(false);
  const { data } = useSuspenseQuery(dancerQueries.profile(username));
  const { mutate, isPending } = useUpdateProfile(username);

  const form = useForm({
    resolver: zodResolver(academicSchema),
    defaultValues: {
      gpa: data.gpa ?? undefined,
      gradYear: data.gradYear ?? undefined,
    },
  });

  const handleSubmit = (formData: AcademicFormData) => {
    mutate(
      { body: formData },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: "Academic info updated",
            type: "success",
          });
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="xs" variant="ghost" className="size-7 p-0" />
        }
      >
        <PencilIcon className="size-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Academic Info</DialogTitle>
          <DialogDescription>
            Update your GPA and graduation year.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <FormProvider {...form}>
            <form
              id="academic-form"
              className="flex w-full flex-col gap-3"
              onSubmit={(e) => form.handleSubmit(handleSubmit)(e)}
            >
              <Controller
                control={form.control}
                name="gpa"
                render={({
                  field: { value, onChange, ...field },
                  fieldState,
                }) => (
                  <Field name={field.name} invalid={fieldState.invalid}>
                    <FieldLabel>GPA</FieldLabel>
                    <NumberField
                      value={value as number | undefined}
                      onValueChange={(val) => onChange(val)}
                      min={0}
                      max={5}
                      step={0.1}
                    >
                      <NumberFieldGroup>
                        <NumberFieldDecrement />
                        <NumberFieldInput
                          inputMode="numeric"
                          maxLength={3}
                          minLength={1}
                          placeholder="GPA"
                        />
                        <NumberFieldIncrement />
                      </NumberFieldGroup>
                    </NumberField>
                    <FieldError error={fieldState.error} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="gradYear"
                render={({
                  field: { value, onChange, ...field },
                  fieldState,
                }) => (
                  <Field name={field.name} invalid={fieldState.invalid}>
                    <FieldLabel>Grad Year</FieldLabel>
                    <NumberField
                      format={{ useGrouping: false }}
                      value={value as number | undefined}
                      onValueChange={(val) => onChange(val)}
                      min={2000}
                      max={2040}
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
                    <FieldError error={fieldState.error} />
                  </Field>
                )}
              />
            </form>
          </FormProvider>
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button type="submit" form="academic-form" disabled={isPending}>
            {isPending ? <Spinner label="Saving..." /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
