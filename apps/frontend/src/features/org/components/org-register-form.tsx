import { useAnchoredErrorToast } from "@/components/hooks/use-anchored-error-toast";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Frame, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { $api } from "@/lib/api/client";
import { handleApiError } from "@/lib/api/errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useOrg } from "@/features/org/context/use-org";

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
  const { mutate, isPending } = $api.useMutation("post", "/orgs/{slug}/register");

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
    <div className="mx-auto w-full max-w-sm space-y-6 p-6">
      {org.logoUrl && (
        <img src={org.logoUrl} alt={org.name} className="mx-auto h-16 w-auto" />
      )}
      <div className="text-center text-white">
        <h1 className="text-2xl font-semibold">You're in!</h1>
        <p className="mt-1 text-sm opacity-80">
          Let's finish your {org.name} profile. Takes 30 seconds.
        </p>
      </div>

      <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
        <Frame>
          <FramePanel className="flex flex-col gap-3 sm:gap-5">
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
          type="submit"
          disabled={isPending}
          className="w-full"
          style={{ background: "var(--org-accent, #e94560)", color: "white" }}
        >
          {isPending ? <Spinner label="Creating account..." /> : "Finish sign up"}
        </Button>
      </form>
    </div>
  );
}
