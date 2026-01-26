import { useAnchoredErrorToast } from "@/components/hooks/use-anchored-error-toast";
import { BirthdayField } from "@/components/shared/birthday-field";
import LocationSelect from "@/components/shared/location-select";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Frame, FramePanel } from "@/components/ui/frame";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { MaskInput } from "@/components/ui/mask-input";
import { Spinner } from "@/components/ui/spinner";
import { handleApiError } from "@/lib/api/errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { PhoneIcon } from "lucide-react";
import { useRef } from "react";
import { Controller, FormProvider, useForm, type FieldErrors } from "react-hook-form";
import { z } from "zod";
import { useOnboardDancer } from "../api/mutations";
import { schemas } from "../schemas";

type OnboardSchema = z.infer<typeof schemas.onboard>;

export function OnboardingForm() {
  const { mutate, isPending } = useOnboardDancer();

  const submitRef = useRef<HTMLButtonElement>(null);
  const errorToast = useAnchoredErrorToast(submitRef);

  const form = useForm<OnboardSchema>({
    resolver: zodResolver(schemas.onboard),
    defaultValues: {
      location: "",
      phoneNumber: "",
    },
  });

  const onSubmit = (data: OnboardSchema) => {
    const birthday = [
      data.birthday.year,
      data.birthday.month,
      data.birthday.day,
    ]
      .map((n) => String(n).padStart(2, "0"))
      .join("-");

    mutate(
      {
        body: {
          ...data,
          platform: "core",
          birthday,
        },
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

  const onError = (errors: FieldErrors<OnboardSchema>) => {
    if (errors.birthday?.message) {
      errorToast.show(errors.birthday.message);
    }
  };

  return (
    <FormProvider {...form}>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => form.handleSubmit(onSubmit, onError)(e)}
      >
        <Frame>
          <FramePanel className="flex flex-col gap-3">
            <BirthdayField name="birthday" />

            <Controller
              control={form.control}
              name="phoneNumber"
              render={({ field, fieldState }) => (
                <Field name={field.name} invalid={fieldState.invalid}>
                  <FieldLabel>Phone Number</FieldLabel>
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
                  <LocationSelect value={field.value} onChange={field.onChange} />
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
        {isPending ? <Spinner label="Onboarding..." /> : "Continue"}
      </Button>
      </form>
    </FormProvider>
  );
}
