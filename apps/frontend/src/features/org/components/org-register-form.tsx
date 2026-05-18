import { useAnchoredErrorToast } from "@/components/hooks/use-anchored-error-toast";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Frame, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { $api } from "@/lib/api/client";
import { handleApiError } from "@/lib/api/errors";
import { useOrg } from "@/features/org/context/use-org";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthPagesSelect } from "@/components/shared/auth-pages-select";
import { Link } from "@tanstack/react-router";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  password: z.string().min(8, "At least 8 characters"),
});

type Schema = z.infer<typeof schema>;

export function OrgRegisterForm({
  token,
  onSuccess,
}: {
  token: string;
  onSuccess: () => void;
}) {
  const { org } = useOrg();
  const { mutate, isPending } = $api.useMutation(
    "post",
    "/orgs/{slug}/register",
  );

  const submitRef = useRef<HTMLButtonElement>(null);
  const errorToast = useAnchoredErrorToast(submitRef);

  const { control, handleSubmit, setError } = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: "", lastName: "", password: "" },
  });

  const onSubmit = (data: Schema) => {
    if (isPending) return;
    mutate(
      {
        params: { path: { slug: org.slug } },
        body: { token, ...data },
      },
      {
        onSuccess,
        onError: handleApiError({
          onValidation(field, message) {
            setError(field as keyof Schema, { message });
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
            name="firstName"
            render={({ field, fieldState }) => (
              <Field name={field.name} invalid={fieldState.invalid}>
                <FieldLabel>First name</FieldLabel>
                <Input autoFocus autoComplete="given-name" {...field} />
                <FieldError error={fieldState.error} />
              </Field>
            )}
          />
          <Controller
            control={control}
            name="lastName"
            render={({ field, fieldState }) => (
              <Field name={field.name} invalid={fieldState.invalid}>
                <FieldLabel>Last name</FieldLabel>
                <Input autoComplete="family-name" {...field} />
                <FieldError error={fieldState.error} />
              </Field>
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <Field name={field.name} invalid={fieldState.invalid}>
                <FieldLabel>Create a password</FieldLabel>
                <PasswordInput autoComplete="new-password" {...field} />
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
        {isPending ? <Spinner label="Creating account..." /> : "Finish sign up"}
      </Button>

      <div className="flex items-center justify-between gap-2">
        <AuthPagesSelect variant="login" />

        <p className="text-muted-foreground text-sm">
          Already have an account?{" "}
          <Button
            type="button"
            variant="link"
            className="text-brand p-0 text-sm font-medium"
            render={
              <Link
                to="/o/$orgSlug/login"
                params={{ orgSlug: org.slug }}
                replace={true}
              />
            }
          >
            Sign in
          </Button>
        </p>
      </div>
    </form>
  );
}
