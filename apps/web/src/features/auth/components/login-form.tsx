import { useCountdown } from "@/components/hooks/use-countdown";
import { MainLogo } from "@/components/shared/main-logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { anchoredToastManager } from "@/components/ui/toast-manager";
import { handleApiErrors } from "@/lib/api/errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from "lucide-react";
import { useReducer, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useLogin } from "../api/mutations";
import { schemas } from "../schemas";
import "./login-form.css";

export function LoginForm() {
  const { mutate, isPending } = useLogin();

  const [retryAfter, startCountdown] = useCountdown();
  const [password, togglePassword] = useReducer((state) => !state, false);

  const submitRef = useRef<HTMLButtonElement>(null);
  const toastIdRef = useRef<string | null>(null);

  const { control, handleSubmit, setError } = useForm<
    z.infer<typeof schemas.login>
  >({
    resolver: zodResolver(schemas.login),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof schemas.login>) => {
    if (!submitRef.current || isPending) return;

    if (toastIdRef.current) {
      anchoredToastManager.close(toastIdRef.current);
      toastIdRef.current = null;
    }

    mutate(
      { body: data },
      {
        onError: ({ errors }) => {
          handleApiErrors(errors, {
            onRateLimit(retryAfter) {
              startCountdown(retryAfter);
            },
            onValidation(field, message) {
              setError(field as keyof z.infer<typeof schemas.login>, {
                message,
              });
            },
            onError(message) {
              setError("root", { message });
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
          });
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-col items-center text-center">
        <CardTitle className="p-2">
          <MainLogo className="h-5 dark:invert" />
        </CardTitle>
        <CardDescription>Sign in to your account to continue</CardDescription>
      </CardHeader>

      <CardContent>
        <form
          className="flex w-full flex-col gap-5"
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
                    <InputGroupInput
                      autoComplete="email"
                      placeholder="Enter your email"
                      type="email"
                      {...field}
                    />
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
                      placeholder="Enter your password"
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
            >
              Sign up
            </Button>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
