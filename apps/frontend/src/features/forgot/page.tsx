import { useAnchoredErrorToast } from "@/components/hooks/use-anchored-error-toast";
import { useCountdown } from "@/components/hooks/use-countdown";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Frame, FramePanel } from "@/components/ui/frame";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { handleApiError } from "@/lib/api/errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { MailIcon } from "lucide-react";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useForgotPassword } from "./api/mutations";
import { forgotSchemas } from "./api/schemas";

type ForgotPasswordSchema = z.infer<typeof forgotSchemas.forgot>;

export function ForgotPasswordForm() {
  const { mutate, isPending } = useForgotPassword();

  const [retryAfter, startCountdown] = useCountdown();

  const submitRef = useRef<HTMLButtonElement>(null);
  const errorToast = useAnchoredErrorToast(submitRef);

  const { control, handleSubmit, setError } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotSchemas.forgot),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordSchema) => {
    if (!submitRef.current || isPending) return;

    mutate(
      { body: data },
      {
        onError: handleApiError({
          onRateLimit(retryAfter) {
            startCountdown(retryAfter);
          },
          onValidation(field, message) {
            setError(field as keyof ForgotPasswordSchema, {
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
    <form
      className="flex w-full flex-col gap-3"
      onSubmit={(e) => handleSubmit(onSubmit)(e)}
    >
      <Frame>
        <FramePanel className="flex w-full flex-col gap-3 sm:gap-5">
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <Field name={field.name} invalid={fieldState.invalid}>
                <FieldLabel>Email</FieldLabel>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <MailIcon className="size-3.5" />
                  </InputGroupAddon>
                  <InputGroupInput
                    autoComplete="email"
                    type="email"
                    {...field}
                  />
                </InputGroup>
                <FieldError error={fieldState.error} />
              </Field>
            )}
          />
        </FramePanel>
      </Frame>

      <Button
        ref={submitRef}
        disabled={isPending || !!retryAfter}
        className="w-full"
        type="submit"
      >
        {isPending ? (
          <Spinner label="Resetting..." />
        ) : retryAfter ? (
          `Retry in ${retryAfter} seconds`
        ) : (
          "Reset"
        )}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Remember your password?{" "}
        <Button
          type="button"
          variant="link"
          className="text-brand p-0 text-sm font-medium"
          render={<Link to="/login" replace={true} />}
        >
          Login
        </Button>
      </p>
    </form>
  );
}
