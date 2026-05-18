import { useAnchoredErrorToast } from "@/components/hooks/use-anchored-error-toast";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { $api } from "@/lib/api/client";
import { handleApiError } from "@/lib/api/errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthPagesSelect } from "@/components/shared/auth-pages-select";
import { Link } from "@tanstack/react-router";
import { MailIcon } from "lucide-react";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Required"),
});

type Schema = z.infer<typeof schema>;

export function OrgLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { mutate, isPending } = $api.useMutation("post", "/auth/login");

  const submitRef = useRef<HTMLButtonElement>(null);
  const errorToast = useAnchoredErrorToast(submitRef);

  const { control, handleSubmit, setError } = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: Schema) => {
    if (isPending) return;
    mutate(
      { body: data },
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
            name="email"
            render={({ field, fieldState }) => (
              <Field name={field.name} invalid={fieldState.invalid}>
                <FieldLabel>Email</FieldLabel>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <MailIcon className="size-3.5" />
                  </InputGroupAddon>
                  <InputGroupInput
                    autoComplete="email"
                    type="email"
                    autoFocus
                    {...field}
                  />
                </InputGroup>
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
                <PasswordInput autoComplete="current-password" {...field} />
                <FieldError error={fieldState.error} />
              </Field>
            )}
          />
        </FramePanel>
        <FrameFooter>
          <Button
            type="button"
            variant="link"
            className="text-muted-foreground ml-auto p-0 text-sm"
            render={<Link to="/forgot" />}
          >
            Forgot password?
          </Button>
        </FrameFooter>
      </Frame>

      <Button
        ref={submitRef}
        disabled={isPending}
        className="w-full"
        type="submit"
      >
        {isPending ? <Spinner label="Signing in..." /> : "Sign in"}
      </Button>

      <div className="flex items-center justify-between gap-2">
        <AuthPagesSelect variant="login" />

        <p className="text-muted-foreground text-sm">
          Don&apos;t have an account?{" "}
          <Button
            type="button"
            variant="link"
            className="text-brand p-0 text-sm font-medium"
            render={<Link to="/signup" replace={true} />}
          >
            Sign up
          </Button>
        </p>
      </div>
    </form>
  );
}
