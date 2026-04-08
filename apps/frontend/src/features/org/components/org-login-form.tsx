import { useAnchoredErrorToast } from "@/components/hooks/use-anchored-error-toast";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Frame, FramePanel } from "@/components/ui/frame";
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
import { MailIcon } from "lucide-react";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useOrg } from "@/features/org/context/use-org";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Required"),
});

type Schema = z.infer<typeof schema>;

export function OrgLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { org } = useOrg();
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
    <div className="mx-auto w-full max-w-sm space-y-6 p-6">
      {org.logoUrl && (
        <img src={org.logoUrl} alt={org.name} className="mx-auto h-16 w-auto" />
      )}
      <h1 className="text-center text-2xl font-semibold text-white">
        Welcome to {org.name}
      </h1>

      <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
        <Frame>
          <FramePanel className="flex flex-col gap-3 sm:gap-5">
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
        </Frame>

        <Button
          ref={submitRef}
          type="submit"
          disabled={isPending}
          className="w-full"
          style={{ background: "var(--org-accent, #e94560)", color: "white" }}
        >
          {isPending ? <Spinner label="Signing in..." /> : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
