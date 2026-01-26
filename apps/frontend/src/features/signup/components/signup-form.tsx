import { useCountdown } from "@/components/hooks/use-countdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Frame, FramePanel } from "@/components/ui/frame";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useParams, useSearch } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon, LockIcon } from "lucide-react";
import { useReducer, useRef } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useSignup } from "../api/mutations";
import { MAX_NAME_LENGTH, MAX_PASSWORD_LENGTH, schemas } from "../schemas";

type SignupSchema = z.infer<typeof schemas.signup>;

export function SignupForm() {
  const { type } = useParams({ from: "/_auth/(routes)/signup/$type" });
  const { username } = useSearch({ from: "/_auth/(routes)/signup/$type" });

  const { mutate, isPending } = useSignup();

  const [retryAfter, startCountdown] = useCountdown();
  const [password, togglePassword] = useReducer((state) => !state, false);

  const submitRef = useRef<HTMLButtonElement>(null);
  const toastIdRef = useRef<string | null>(null);

  const { control, handleSubmit, setError } = useForm<SignupSchema>({
    resolver: zodResolver(schemas.signup),
    defaultValues: {
      email: "",
      type,
      firstName: "",
      lastName: "",
      username,
      phone: "",
      password: "",
      termsChecked: false,
    },
  });

  const termsChecked = useWatch({ control, name: "termsChecked" });

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
          onError(error) {
            setError("root", { message: error.message });
            toastIdRef.current = anchoredToastManager.add({
              title: "Error",
              description: error.message,
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
      <Frame className="gap-2">
        <FramePanel className="flex flex-col gap-3">
          <div className="flex bg-accent/30 hover:bg-accent/50 transition-colors items-center justify-between rounded-lg border border-border px-3 py-2">
            <span className="text-xs text-muted-foreground">Signing up as</span>
            <Badge
              variant="brand"
              size="sm"
              className="rounded-full"
              render={<Link to="/signup" />}
            >
              @{username}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="firstName"
              render={({ field, fieldState }) => (
                <Field name={field.name} invalid={fieldState.invalid}>
                  <FieldLabel>First Name</FieldLabel>
                  <Input maxLength={MAX_NAME_LENGTH} type="text" {...field} />
                </Field>
              )}
            />

            <Controller
              control={control}
              name="lastName"
              render={({ field, fieldState }) => (
                <Field name={field.name} invalid={fieldState.invalid}>
                  <FieldLabel>Last Name</FieldLabel>
                  <Input maxLength={MAX_NAME_LENGTH} type="text" {...field} />
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
                    maxLength={MAX_PASSWORD_LENGTH}
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

        <Controller
          control={control}
          name="termsChecked"
          render={({ field, fieldState }) => (
            <Field name={field.name} invalid={fieldState.invalid}>
              <FramePanel className="select-none hover:bg-muted/10 has-data-checked:border-primary/48 has-data-checked:bg-muted/50 p-0!">
                <FieldLabel className="flex items-start gap-2 p-3">
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
              </FramePanel>
              <FieldError error={fieldState.error} />
            </Field>
          )}
        />
      </Frame>

      <Button
        ref={submitRef}
        disabled={isPending || !!retryAfter || !termsChecked}
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
          render={<Link to="/login" replace={true} />}
        >
          Login
        </Button>
      </p>
    </form>
  );
}
