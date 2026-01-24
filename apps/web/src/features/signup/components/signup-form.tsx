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
import { Checkbox } from "@/components/ui/checkbox";
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
import { Link } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from "lucide-react";
import { useReducer, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useSignup } from "../api/mutations";
import { schemas } from "../schemas";
import "./login-form.css";

export function SignupForm() {
  const { mutate, isPending } = useSignup();

  const [retryAfter, startCountdown] = useCountdown();
  const [password, togglePassword] = useReducer((state) => !state, false);

  const submitRef = useRef<HTMLButtonElement>(null);
  const toastIdRef = useRef<string | null>(null);

  const { control, handleSubmit, setError } = useForm<
    z.infer<typeof schemas.signup>
  >({
    resolver: zodResolver(schemas.signup),
    defaultValues: {
      email: "",
      accountType: "dancer",
      firstName: "",
      lastName: "",
      username: "",
      phone: "",
      password: "",
      confirmPassword: "",
      termsChecked: false,
    },
  });

  const onSubmit = async (data: z.infer<typeof schemas.signup>) => {
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
              setError(field as keyof z.infer<typeof schemas.signup>, {
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
        <CardDescription>Create an account to continue</CardDescription>
      </CardHeader>

      <CardContent>
        <form
          className="flex w-full flex-col gap-5"
          onSubmit={(e) => handleSubmit(onSubmit)(e)}
        >
          <div className="animate-fade-in-up flex items-center gap-2 animate-delay-1">
            <Controller
              control={control}
              name="firstName"
              render={({ field, fieldState }) => (
                <Field name={field.name} invalid={fieldState.invalid}>
                  <FieldLabel>First Name</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <MailIcon />
                    </InputGroupAddon>
                    <InputGroupInput
                      placeholder="Enter your first name"
                      type="text"
                      {...field}
                    />
                  </InputGroup>
                  <FieldError error={fieldState.error} />
                </Field>
              )}
            />

            <Controller
              control={control}
              name="lastName"
              render={({ field, fieldState }) => (
                <Field name={field.name} invalid={fieldState.invalid}>
                  <FieldLabel>Last Name</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <MailIcon />
                    </InputGroupAddon>
                    <InputGroupInput
                      placeholder="Enter your last name"
                      type="text"
                      {...field}
                    />
                  </InputGroup>
                  <FieldError error={fieldState.error} />
                </Field>
              )}
            />
          </div>

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

          <div className="animate-fade-in-up animate-delay-1">
            <Controller
              control={control}
              name="username"
              render={({ field, fieldState }) => (
                <Field name={field.name} invalid={fieldState.invalid}>
                  <FieldLabel>Username</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <MailIcon />
                    </InputGroupAddon>
                    <InputGroupInput
                      placeholder="Enter your username"
                      type="text"
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

          <div className="animate-fade-in-up animate-delay-2">
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field, fieldState }) => (
                <Field name={field.name} invalid={fieldState.invalid}>
                  <FieldLabel>Confirm Password</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <LockIcon />
                    </InputGroupAddon>
                    <InputGroupInput
                      type={password ? "text" : "password"}
                      autoComplete="off"
                      placeholder="Confirm your password"
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

          <div className="animate-fade-in-up animate-delay-2">
            <Controller
              control={control}
              name="termsChecked"
              render={({ field, fieldState }) => (
                <Field name={field.name} invalid={fieldState.invalid}>
                  <FieldLabel>Terms and Conditions</FieldLabel>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <FieldError error={fieldState.error} />
                </Field>
              )}
            />
          </div>

          <div className="animate-fade-in-up animate-delay-4">
            <Button
              ref={submitRef}
              disabled={isPending || !!retryAfter}
              className="w-full"
              type="submit"
            >
              {isPending ? (
                <Spinner label="Signing up..." />
              ) : retryAfter ? (
                `Retry in ${retryAfter} seconds`
              ) : (
                "Sign up"
              )}
            </Button>
          </div>

          <p className="animate-fade-in-up animate-delay-5 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button
              type="button"
              variant="link"
              className="p-0 text-sm font-medium text-brand"
              render={<Link to="/login" />}
            >
              Login
            </Button>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
