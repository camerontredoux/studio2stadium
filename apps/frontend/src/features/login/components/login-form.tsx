import { useAnchoredErrorToast } from "@/components/hooks/use-anchored-error-toast";
import { useCountdown } from "@/components/hooks/use-countdown";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { Toggle } from "@/components/ui/toggle";
import { handleApiError } from "@/lib/api/errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from "lucide-react";
import { useReducer, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useLogin } from "../api/mutations";
import { schemas } from "../schemas";

type LoginSchema = z.infer<typeof schemas.login>;

export function LoginForm() {
  const { mutate, isPending } = useLogin();

  const [retryAfter, startCountdown] = useCountdown();
  const [password, togglePassword] = useReducer((state) => !state, false);

  const submitRef = useRef<HTMLButtonElement>(null);
  const errorToast = useAnchoredErrorToast(submitRef);

  const { control, handleSubmit, setError } = useForm<LoginSchema>({
    resolver: zodResolver(schemas.login),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginSchema) => {
    if (!submitRef.current || isPending) return;

    mutate(
      { body: data },
      {
        onError: handleApiError({
          onRateLimit(retryAfter) {
            startCountdown(retryAfter);
          },
          onValidation(field, message) {
            setError(field as keyof LoginSchema, {
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

          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <Field name={field.name} invalid={fieldState.invalid}>
                <FieldLabel>Password</FieldLabel>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <LockIcon className="size-3.5" />
                  </InputGroupAddon>
                  <InputGroupInput
                    type={password ? "text" : "password"}
                    autoComplete="off"
                    {...field}
                  />
                  <InputGroupAddon align="inline-end">
                    <Toggle tabIndex={-1} size="xs" onClick={togglePassword}>
                      {password ? <EyeOffIcon /> : <EyeIcon />}
                    </Toggle>
                  </InputGroupAddon>
                </InputGroup>
                <FieldError error={fieldState.error} />
              </Field>
            )}
          />
        </FramePanel>
        <FrameFooter>
          <Button
            type="button"
            variant="link"
            className="p-0 ml-auto text-sm text-muted-foreground"
          >
            Forgot password?
          </Button>
        </FrameFooter>
      </Frame>

      <Button
        ref={submitRef}
        disabled={isPending || !!retryAfter}
        className="w-full"
        type="submit"
      >
        {isPending ? (
          <Spinner label="Signing in..." />
        ) : retryAfter ? (
          `Retry in ${retryAfter} seconds`
        ) : (
          "Sign in"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Button
          type="button"
          variant="link"
          className="p-0 text-sm font-medium text-brand"
          render={<Link to="/signup" replace={true} />}
        >
          Sign up
        </Button>
      </p>
    </form>
  );
}
