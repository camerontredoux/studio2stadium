import { useAnchoredErrorToast } from "@/components/hooks/use-anchored-error-toast";
import { BirthdayField } from "@/components/shared/birthday-field";
import LocationSelect from "@/components/shared/location-select";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Frame, FramePanel } from "@/components/ui/frame";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { MaskInput } from "@/components/ui/mask-input";
import { Spinner } from "@/components/ui/spinner";
import { handleApiError } from "@/lib/api/errors";
import { makeBirthday } from "@/utils/birthday";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { PhoneIcon } from "lucide-react";
import { useRef, useState } from "react";
import {
  Controller,
  FormProvider,
  useForm,
  type FieldErrors,
} from "react-hook-form";
import { z } from "zod";
import { useCreateDancer } from "../api/mutations";
import { schemas } from "../schemas";

type OnboardSchema = z.infer<typeof schemas.onboard>;

export function OnboardingForm({ redirect }: { redirect?: string }) {
  const { mutate, isPending } = useCreateDancer(redirect);

  const submitRef = useRef<HTMLButtonElement>(null);
  const errorToast = useAnchoredErrorToast(submitRef);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<OnboardSchema | null>(null);

  const form = useForm<OnboardSchema>({
    resolver: zodResolver(schemas.onboard),
    defaultValues: {
      location: "",
      phoneNumber: "",
    },
  });

  // Validation runs before the confirmation opens, so an invalid or missing
  // birth date never reaches the alert.
  const onValid = (data: OnboardSchema) => {
    setPendingData(data);
    setConfirmOpen(true);
  };

  const onConfirm = () => {
    if (!pendingData) return;

    const birthday = makeBirthday(pendingData.birthday);

    mutate(
      {
        body: {
          ...pendingData,
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
        // Close the alert so field errors and the anchored toast aren't
        // trapped behind the backdrop.
        onSettled: () => setConfirmOpen(false),
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
        onSubmit={(e) => form.handleSubmit(onValid, onError)(e)}
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
          {isPending ? <Spinner label="Onboarding..." /> : "Continue"}
        </Button>
      </form>

      <AlertDialog
        open={confirmOpen}
        // Can't be dismissed mid-request.
        onOpenChange={(open) => {
          if (isPending) return;
          setConfirmOpen(open);
        }}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Is this the dancer's birth date?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingData ? (
                <>
                  You entered{" "}
                  <span className="text-foreground font-medium">
                    {format(
                      new Date(
                        pendingData.birthday.year,
                        pendingData.birthday.month - 1,
                        pendingData.birthday.day,
                      ),
                      "MMMM d, yyyy",
                    )}
                  </span>
                  . Make sure this is the dancer's birth date — not a parent's
                  or guardian's.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose
              render={<Button variant="ghost" disabled={isPending} />}
            >
              Go back
            </AlertDialogClose>
            <Button onClick={onConfirm} disabled={isPending}>
              {isPending ? (
                <Spinner label="Submitting..." />
              ) : (
                "Yes, that's correct"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </FormProvider>
  );
}
