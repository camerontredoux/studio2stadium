import { useCountdown } from "@/components/hooks/use-countdown";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
import { EyeIcon, EyeOffIcon, LockIcon } from "lucide-react";
import { useReducer, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useSignup } from "../api/mutations";
import { schemas } from "../schemas";

type SignupSchema = z.infer<typeof schemas.signup>;

export function SignupForm() {
  const { mutate, isPending } = useSignup();

  const [retryAfter, startCountdown] = useCountdown();
  const [password, togglePassword] = useReducer((state) => !state, false);

  const submitRef = useRef<HTMLButtonElement>(null);
  const toastIdRef = useRef<string | null>(null);

  const { control, handleSubmit, setError, watch } = useForm<SignupSchema>({
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

  const onSubmit = async ({ confirmPassword: _, ...data }: SignupSchema) => {
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
            setError(field as keyof SignupSchema, {
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
        }),
      },
    );
  };
  return (
    <form
      className="flex w-full flex-col gap-3"
      onSubmit={(e) => handleSubmit(onSubmit)(e)}
    >
      <div className="animate-fade-in-up flex items-center gap-2 animate-delay-1">
        <Controller
          control={control}
          name="firstName"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FieldLabel>First Name</FieldLabel>
              <Input type="text" {...field} />
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
              <Input type="text" {...field} />
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
              <Input type="email" {...field} />
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
              <Input type="text" {...field} />
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
              <FieldLabel className="flex items-start gap-2 rounded-lg border p-3 hover:bg-accent/50 has-data-checked:border-primary/48 has-data-checked:bg-accent/50">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <div className="flex flex-col gap-1">
                  <p>Accept terms and conditions</p>
                  <p className="text-xs text-muted-foreground font-light">
                    By clicking this checkbox, you agree to the{" "}
                    <a
                      className="text-brand underline"
                      href="https://marketing.studio2stadium.com/terms"
                      target="_blank"
                    >
                      terms and conditions
                    </a>
                  </p>
                </div>
              </FieldLabel>
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
      </div>

      <div className="animate-fade-in-up animate-delay-4">
        <Button
          ref={submitRef}
          disabled={isPending || !!retryAfter || !watch("termsChecked")}
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
  );
}
