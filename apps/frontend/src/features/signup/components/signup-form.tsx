import { useAnchoredErrorToast } from "@/components/hooks/use-anchored-error-toast";
import { useCountdown } from "@/components/hooks/use-countdown";
import LocationSelect from "@/components/shared/location-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Frame, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { handleApiError } from "@/lib/api/errors";
import { MAX_PASSWORD_LENGTH } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useParams, useSearch } from "@tanstack/react-router";
import { useRef } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useSignup } from "../api/mutations";
import { MAX_NAME_LENGTH, schemas } from "../api/schemas";

type SignupSchema = z.infer<typeof schemas.signup>;

export function SignupForm() {
  const { type } = useParams({ from: "/_auth/(routes)/signup/$type" });
  const { username, schoolName } = useSearch({
    from: "/_auth/(routes)/signup/$type",
  });

  const { mutate, isPending } = useSignup();

  const [retryAfter, startCountdown] = useCountdown();

  const submitRef = useRef<HTMLButtonElement>(null);
  const errorToast = useAnchoredErrorToast(submitRef);

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
      name: schoolName,
      location: "",
      termsChecked: false,
    },
  });

  const termsChecked = useWatch({ control, name: "termsChecked" });
  const name = useWatch({ control, name: "name" });

  const onSubmit = async (data: SignupSchema) => {
    if (!submitRef.current || isPending) return;

    mutate(
      { body: { ...data, name } },
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
      <Frame className="gap-2">
        <FramePanel className="flex flex-col gap-3">
          <div className="bg-accent/30 hover:bg-accent/50 border-border min-x-0 flex items-center justify-between rounded-lg border px-3 py-2 transition-colors">
            <span className="text-muted-foreground truncate text-xs">
              {type === "school" ? (
                <Controller
                  control={control}
                  name="name"
                  render={({ field }) => <span>{field.value}</span>}
                />
              ) : (
                <>
                  <span>Signing up as</span>
                  <Badge
                    variant="brand"
                    size="sm"
                    className="rounded-full"
                    render={<Link to="/signup" />}
                  >
                    @{username}
                  </Badge>
                </>
              )}
            </span>
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

          {type === "school" && (
            <Controller
              control={control}
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
          )}

          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <Field name={field.name} invalid={fieldState.invalid}>
                <FieldLabel>Password</FieldLabel>
                <PasswordInput
                  maxLength={MAX_PASSWORD_LENGTH}
                  autoComplete="off"
                  {...field}
                />
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
              <FramePanel className="hover:bg-muted/10 has-data-checked:border-primary/48 has-data-checked:bg-muted/50 p-0! select-none">
                <FieldLabel className="flex items-start gap-2 p-3">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex flex-col gap-1">
                    <p>Accept terms and conditions</p>
                    <p className="text-muted-foreground text-xs font-light">
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

      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
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
