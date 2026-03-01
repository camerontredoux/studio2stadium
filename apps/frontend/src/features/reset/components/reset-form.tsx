import { useAnchoredErrorToast } from "@/components/hooks/use-anchored-error-toast";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Frame, FramePanel } from "@/components/ui/frame";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { handleApiError } from "@/lib/api/errors";
import { MAX_PASSWORD_LENGTH } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useSearch } from "@tanstack/react-router";
import { CheckIcon, XIcon } from "lucide-react";
import { useId, useMemo, useRef } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useResetPassword } from "../api/mutations";
import { resetSchemas } from "../api/schemas";

const requirements = [
  { regex: /.{8,}/, text: "At least 8 characters" },
  { regex: /[0-9]/, text: "At least 1 number" },
  { regex: /[a-z]/, text: "At least 1 lowercase letter" },
  { regex: /[A-Z]/, text: "At least 1 uppercase letter" },
  {
    regex: /[ !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/,
    text: "At least 1 special character",
  },
];

const formSchema = resetSchemas.reset
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormSchema = z.infer<typeof formSchema>;

export function ResetForm() {
  const id = useId();
  const { token, userId } = useSearch({ from: "/_auth/(routes)/reset" });

  const { mutate, isPending } = useResetPassword();

  const submitRef = useRef<HTMLButtonElement>(null);
  const errorToast = useAnchoredErrorToast(submitRef);

  const { control, handleSubmit, setError } = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
      token,
      userId,
    },
  });

  const password = useWatch({ control, name: "password" });

  const strength = requirements.map((req) => ({
    met: req.regex.test(password),
    text: req.text,
  }));

  const strengthScore = useMemo(() => {
    return strength.filter((req) => req.met).length;
  }, [strength]);

  const getStrengthColor = (score: number) => {
    if (score === 0) return "bg-border";
    if (score <= 1) return "bg-red-500";
    if (score <= 2) return "bg-orange-500";
    if (score <= 3) return "bg-amber-500";
    if (score === 4) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  const getStrengthText = (score: number) => {
    if (score === 0) return "Enter a password";
    if (score <= 2) return "Weak password";
    if (score <= 3) return "Medium password";
    if (score === 4) return "Good password";
    return "Strong password";
  };

  const onSubmit = (data: FormSchema) => {
    if (!submitRef.current || isPending) return;

    mutate(
      {
        body: {
          password: data.password,
          token: data.token,
          userId: data.userId,
        },
      },
      {
        onError: handleApiError({
          onValidation(field, message) {
            setError(field as keyof FormSchema, { message });
          },
          onError(error) {
            setError("root", { message: error.message });
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
        <FramePanel className="flex flex-col gap-3">
          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <Field name={field.name} invalid={fieldState.invalid}>
                <FieldLabel>New Password</FieldLabel>
                <PasswordInput
                  maxLength={MAX_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  {...field}
                />
                <FieldError error={fieldState.error} />
              </Field>
            )}
          />

          <div
            aria-label="Password strength"
            aria-valuemax={5}
            aria-valuemin={0}
            aria-valuenow={strengthScore}
            className="bg-border h-1 w-full overflow-hidden rounded-full"
            role="progressbar"
            tabIndex={-1}
          >
            <div
              className={`h-full ${getStrengthColor(strengthScore)} transition-all duration-500 ease-out`}
              style={{ width: `${(strengthScore / 5) * 100}%` }}
            />
          </div>

          <p
            className="text-foreground text-sm font-medium"
            id={`${id}-description`}
          >
            {getStrengthText(strengthScore)}. Must contain:
          </p>

          <ul aria-label="Password requirements" className="space-y-1.5">
            {strength.map((req) => (
              <li className="flex items-center gap-2" key={req.text}>
                {req.met ? (
                  <CheckIcon
                    aria-hidden="true"
                    className="size-4 text-emerald-500"
                  />
                ) : (
                  <XIcon
                    aria-hidden="true"
                    className="text-muted-foreground/80 size-4"
                  />
                )}
                <span
                  className={`text-xs ${req.met ? "text-emerald-600" : "text-muted-foreground"}`}
                >
                  {req.text}
                  <span className="sr-only">
                    {req.met ? " - Requirement met" : " - Requirement not met"}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <Field name={field.name} invalid={fieldState.invalid}>
                <FieldLabel>Confirm Password</FieldLabel>
                <PasswordInput
                  maxLength={MAX_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  {...field}
                />
                <FieldError error={fieldState.error} />
              </Field>
            )}
          />
        </FramePanel>
      </Frame>

      <Button
        ref={submitRef}
        disabled={isPending}
        className="w-full"
        type="submit"
      >
        {isPending ? (
          <Spinner label="Resetting password..." />
        ) : (
          "Reset Password"
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
