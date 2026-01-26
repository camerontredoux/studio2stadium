import LocationSelect from "@/components/shared/location-select";
import { MonthSelect } from "@/components/shared/month-select";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Frame, FramePanel } from "@/components/ui/frame";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { MaskInput } from "@/components/ui/mask-input";
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
} from "@/components/ui/number-field";
import { Spinner } from "@/components/ui/spinner";
import { anchoredToastManager } from "@/components/ui/toast-manager";
import { useOnboardDancer } from "@/features/onboarding/api/mutations";
import { schemas } from "@/features/onboarding/schemas";
import { handleApiError } from "@/lib/api/errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { PhoneIcon } from "lucide-react";
import { useRef } from "react";
import { Controller, useForm, type FieldErrors } from "react-hook-form";
import { z } from "zod";

export const Route = createFileRoute("/_onboarding/(routes)/onboarding/")({
  component: RouteComponent,
});

type OnboardSchema = z.infer<typeof schemas.onboard>;

function RouteComponent() {
  const { mutate, isPending } = useOnboardDancer();

  const submitRef = useRef<HTMLButtonElement>(null);
  const toastIdRef = useRef<string | null>(null);

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
            if (toastIdRef.current) {
              anchoredToastManager.close(toastIdRef.current);
              toastIdRef.current = null;
            }

            toastIdRef.current = anchoredToastManager.add({
              title: "Error",
              type: "error",
              description: error.message,
              positionerProps: {
                anchor: submitRef.current,
                sideOffset: 8,
              },
            });
          },
        }),
      },
    );
  };

  const onError = (errors: FieldErrors<OnboardSchema>) => {
    if (toastIdRef.current) {
      anchoredToastManager.close(toastIdRef.current);
      toastIdRef.current = null;
    }

    if (errors.birthday?.message) {
      toastIdRef.current = anchoredToastManager.add({
        title: "Error",
        type: "error",
        description: errors.birthday.message,
        positionerProps: {
          anchor: submitRef.current,
          sideOffset: 8,
        },
      });
    }
  };

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => form.handleSubmit(onSubmit, onError)(e)}
    >
      <Frame>
        <FramePanel className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label>Birth Date</Label>
            <div className="grid grid-cols-4 items-center gap-2">
              <Controller
                control={form.control}
                name="birthday.month"
                render={({ field, fieldState }) => (
                  <Field
                    className="col-span-2"
                    name={field.name}
                    invalid={fieldState.invalid}
                  >
                    <MonthSelect
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="birthday.day"
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
                control={form.control}
                name="birthday.year"
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
  );
}
