import { useAnchoredErrorToast } from "@/components/hooks/use-anchored-error-toast";
import LocationSelect from "@/components/shared/location-select";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Frame, FramePanel } from "@/components/ui/frame";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { MaskInput } from "@/components/ui/mask-input";
import { Spinner } from "@/components/ui/spinner";
import { useSubmitApplication } from "@/features/settings/api/mutations";
import { accountSchemas } from "@/features/settings/api/schemas";
import { handleApiError } from "@/lib/api/errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { PhoneIcon } from "lucide-react";
import { useRef } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

type OnboardSchema = z.infer<typeof accountSchemas.submitApplication>;

export function ApplicationForm() {
  const { mutate, isPending } = useSubmitApplication();

  const submitRef = useRef<HTMLButtonElement>(null);
  const errorToast = useAnchoredErrorToast(submitRef);

  const form = useForm<OnboardSchema>({
    resolver: zodResolver(accountSchemas.submitApplication),
    defaultValues: {
      idType: "",
      location: "",
      mediaId: "",
    },
  });

  const onSubmit = (data: OnboardSchema) => {
    mutate(
      {
        body: data,
      },
      {
        onError: handleApiError({
          onValidation(field, message) {
            form.setError(field as keyof OnboardSchema, {
              message,
            });
          },
          onError(error) {
            errorToast.show(error.message);
          },
        }),
      },
    );
  };

  return (
    <FormProvider {...form}>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => form.handleSubmit(onSubmit)(e)}
      >
        <Frame>
          <FramePanel className="flex flex-col gap-3">
            <Controller
              control={form.control}
              name="idType"
              render={({ field, fieldState }) => (
                <Field name={field.name} invalid={fieldState.invalid}>
                  <FieldLabel>ID Type</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <PhoneIcon className="size-3.5" />
                    </InputGroupAddon>
                    <MaskInput
                      unstyled
                      type="tel"
                      mask="phone"
                      value={field.value}
                      onValueChange={(_, unmaskedValue) => {
                        field.onChange(unmaskedValue);
                      }}
                    />
                  </InputGroup>
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="location"
              render={({ field, fieldState }) => (
                <Field name={field.name} invalid={fieldState.invalid}>
                  <FieldLabel>Location</FieldLabel>
                  <LocationSelect
                    value={field.value}
                    onChange={field.onChange}
                  />
                  <FieldError error={fieldState.error} />
                </Field>
              )}
            />
          </FramePanel>
        </Frame>

        <Button
          disabled={isPending}
          ref={submitRef}
          type="submit"
          className="w-full"
        >
          {isPending ? <Spinner label="Submitting..." /> : "Continue"}
        </Button>
      </form>
    </FormProvider>
  );
}
