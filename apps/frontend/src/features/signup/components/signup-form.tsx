import { useCountdown } from "@/components/hooks/use-countdown";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { anchoredToastManager } from "@/components/ui/toast-manager";
import { Toggle } from "@/components/ui/toggle";
import { handleApiError } from "@/lib/api/errors";
import "@/styles/staggered.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useSearch } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon, LockIcon } from "lucide-react";
import { useReducer, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useSignup } from "../api/mutations";
import { schemas } from "../schemas";

type SignupSchema = z.infer<typeof schemas.signup>;

export function SignupForm() {
  const { username } = useSearch({ from: "/_auth/(routes)/signup/$type" });

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
      username,
      phone: "",
      password: "",
      termsChecked: false,
    },
  });

  const onSubmit = async (data: SignupSchema) => {
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
      <Frame>
        <FramePanel className="flex w-full flex-col gap-3">
          <div className="flex items-center gap-2">
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
        <FrameFooter className={watch("password") ? "block" : "hidden"}>
          <Controller
            control={control}
            name="termsChecked"
            render={({ field, fieldState }) => (
              <Field name={field.name} invalid={fieldState.invalid}>
                <FieldLabel className="flex items-start gap-2 rounded-xl border select-none p-3 hover:bg-accent/50 has-data-checked:border-primary/48 has-data-checked:bg-accent/50 shadow-xs transition-colors before:pointer-events-none before:absolute before:inset-0 not-has-focus:before:shadow-[0_1px_--theme(--color-black/4%)] before:rounded-[calc(var(--radius-lg)-1px)]">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex flex-col gap-1">
                    <p>Accept terms and conditions</p>
                    <p className="text-xs text-muted-foreground font-light">
                      By clicking this checkbox, you agree to our{" "}
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
        </FrameFooter>
      </Frame>

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

      <p className="text-center text-sm text-muted-foreground">
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
