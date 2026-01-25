import { useCountdown } from "@/components/hooks/use-countdown";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { anchoredToastManager } from "@/components/ui/toast-manager";
import { handleApiError } from "@/lib/api/errors";
import "@/styles/staggered.css";
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
  const toastIdRef = useRef<string | null>(null);

  const { control, handleSubmit, setError } = useForm<LoginSchema>({
    resolver: zodResolver(schemas.login),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginSchema) => {
    if (!submitRef.current || isPending) return;

    if (toastIdRef.current) {
      anchoredToastManager.close(toastIdRef.current);
      toastIdRef.current = null;
    }

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
          onError(message) {
            toastIdRef.current = anchoredToastManager.add({
              title: "Error",
              description: message,
              type: "error",
              timeout: 3000,
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

  return (
    <form
      className="flex w-full flex-col gap-3 sm:gap-5"
      onSubmit={(e) => handleSubmit(onSubmit)(e)}
    >
      <div className="animate-fade-in-up animate-delay-1">
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Email</FieldLabel>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <MailIcon />
                </InputGroupAddon>
                <InputGroupInput autoComplete="email" type="email" {...field} />
              </InputGroup>
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
      </div>

      <div className="animate-fade-in-up animate-delay-2">
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>Password</FieldLabel>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <LockIcon />
                </InputGroupAddon>
                <InputGroupInput
                  type={password ? "text" : "password"}
                  autoComplete="off"
                  {...field}
                />
                <InputGroupAddon align="inline-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={togglePassword}
                  >
                    {password ? <EyeOffIcon /> : <EyeIcon />}
                  </Button>
                </InputGroupAddon>
              </InputGroup>
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
      </div>

      <div className="animate-fade-in-up animate-delay-3 flex items-center justify-end">
        <Button
          type="button"
          variant="link"
          className="p-0 text-sm text-muted-foreground"
        >
          Forgot password?
        </Button>
      </div>

      <div className="animate-fade-in-up animate-delay-4">
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
      </div>

      <p className="animate-fade-in-up animate-delay-5 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Button
          type="button"
          variant="link"
          className="p-0 text-sm font-medium text-brand"
          render={<Link to="/signup" />}
        >
          Sign up
        </Button>
      </p>
    </form>
  );
}
