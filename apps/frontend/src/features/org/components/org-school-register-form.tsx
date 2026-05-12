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
import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  firstName: z.string().min(1, "Required").max(64),
  lastName: z.string().min(1, "Required").max(64),
  name: z.string().min(1, "Required").max(128),
  location: z.string().min(1, "Required").max(256),
  city: z.string().max(128).optional().or(z.literal("")),
  password: z.string().min(8, "At least 8 characters").max(128),
});

type Schema = z.infer<typeof schema>;

export function OrgSchoolRegisterForm({
  token,
  onSuccess,
}: {
  token: string;
  onSuccess: () => void;
}) {
  const { org } = useOrg();

  const inviteQuery = $api.useQuery(
    "get",
    "/orgs/invites/school/{token}",
    { params: { path: { token } } },
    { retry: false },
  );

  const { mutate, isPending } = $api.useMutation(
    "post",
    "/orgs/register/school",
  );

  const submitRef = useRef<HTMLButtonElement>(null);
  const errorToast = useAnchoredErrorToast(submitRef);

  const { control, handleSubmit, setError, reset } = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      name: "",
      location: "",
      city: "",
      password: "",
    },
  });

  useEffect(() => {
    if (inviteQuery.data) {
      reset({
        firstName: "",
        lastName: "",
        name: inviteQuery.data.organization ?? "",
        location: "",
        city: "",
        password: "",
      });
    }
  }, [inviteQuery.data, reset]);

  if (inviteQuery.isLoading) {
    return (
      <div className="flex w-full justify-center py-12">
        <Spinner label="Loading invite..." />
      </div>
    );
  }

  if (inviteQuery.isError || !inviteQuery.data) {
    return (
      <Frame>
        <FramePanel className="flex flex-col gap-3 text-sm">
          <p className="font-medium">This invite link is no longer valid.</p>
          <p className="text-muted-foreground">
            Your invite may have expired, been used, or been replaced by a newer
            one from {org.name}. Ask the admin to resend your invitation.
          </p>
          <Button
            type="button"
            variant="outline"
            className="self-start"
            render={
              <Link to="/$orgSlug/login" params={{ orgSlug: org.slug }} />
            }
          >
            Go to {org.name} sign in
          </Button>
        </FramePanel>
      </Frame>
    );
  }

  const onSubmit = (data: Schema) => {
    if (isPending) return;
    mutate(
      {
        body: {
          token,
          firstName: data.firstName,
          lastName: data.lastName,
          name: data.name,
          location: data.location,
          city: data.city ? data.city : undefined,
          password: data.password,
        },
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
          <div className="text-muted-foreground text-xs">
            Inviting <span className="text-foreground font-medium">{inviteQuery.data.email}</span>
            {inviteQuery.data.eventName ? (
              <> · {inviteQuery.data.eventName}</>
            ) : null}
          </div>

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
            name="name"
            render={({ field, fieldState }) => (
              <Field name={field.name} invalid={fieldState.invalid}>
                <FieldLabel>School name</FieldLabel>
                <Input
                  autoComplete="organization"
                  placeholder="e.g. University of Southern California"
                  {...field}
                />
                <FieldError error={fieldState.error} />
              </Field>
            )}
          />
          <Controller
            control={control}
            name="location"
            render={({ field, fieldState }) => (
              <Field name={field.name} invalid={fieldState.invalid}>
                <FieldLabel>Location</FieldLabel>
                <Input
                  autoComplete="address-level1"
                  placeholder="State / region"
                  {...field}
                />
                <FieldError error={fieldState.error} />
              </Field>
            )}
          />
          <Controller
            control={control}
            name="city"
            render={({ field, fieldState }) => (
              <Field name={field.name} invalid={fieldState.invalid}>
                <FieldLabel>City (optional)</FieldLabel>
                <Input autoComplete="address-level2" {...field} />
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
        {isPending ? <Spinner label="Creating account..." /> : "Create account"}
      </Button>

      <div className="flex items-center justify-between gap-2">
        <a
          href="https://studio2stadium.com"
          target="_blank"
          rel="noreferrer"
          className="text-brand text-sm font-medium hover:underline"
        >
          Marketing
        </a>

        <p className="text-muted-foreground text-sm">
          Already have an account?{" "}
          <Button
            type="button"
            variant="link"
            className="text-brand p-0 text-sm font-medium"
            render={
              <Link
                to="/$orgSlug/login"
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
