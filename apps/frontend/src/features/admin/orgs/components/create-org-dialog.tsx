import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toastManager } from "@/components/ui/toast-manager";
import { useCreateOrg } from "@/features/admin/api/mutations";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const createOrgSchema = z.object({
  name: z.string().min(1, "Name is required").max(128),
  slug: z.string().min(1, "Slug is required").max(64).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  primaryColor: z.string().max(16).optional().or(z.literal("")),
  accentColor: z.string().max(16).optional().or(z.literal("")),
});

type CreateOrgForm = z.infer<typeof createOrgSchema>;

interface CreateOrgDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrgDialog({ open, onOpenChange }: CreateOrgDialogProps) {
  const { mutate: createOrg, isPending } = useCreateOrg();

  const form = useForm<CreateOrgForm>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: { name: "", slug: "", primaryColor: "", accentColor: "" },
  });

  const onSubmit = (data: CreateOrgForm) => {
    createOrg(
      {
        body: {
          name: data.name,
          slug: data.slug,
          primaryColor: data.primaryColor || undefined,
          accentColor: data.accentColor || undefined,
        },
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Organization created",
            description: `${data.name} has been created`,
            type: "success",
          });
          form.reset();
          onOpenChange(false);
        },
        onError: () => {
          toastManager.add({
            title: "Error",
            description: "Failed to create organization. The slug may already be taken.",
            type: "error",
          });
        },
      },
    );
  };

  const nameValue = form.watch("name");

  const generateSlug = () => {
    if (nameValue) {
      const slug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      form.setValue("slug", slug, { shouldValidate: true });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>
            Add a new organization to the platform.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <form
            id="create-org-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field name={field.name} invalid={fieldState.invalid}>
                  <FieldLabel>Name</FieldLabel>
                  <Input
                    {...field}
                    placeholder="The Summit"
                    onBlur={() => {
                      field.onBlur();
                      if (!form.getValues("slug")) {
                        generateSlug();
                      }
                    }}
                  />
                  <FieldError error={fieldState.error} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="slug"
              render={({ field, fieldState }) => (
                <Field name={field.name} invalid={fieldState.invalid}>
                  <FieldLabel>
                    Slug
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="text-muted-foreground ml-auto text-xs"
                      onClick={generateSlug}
                    >
                      Generate
                    </Button>
                  </FieldLabel>
                  <Input {...field} placeholder="the-summit" />
                  <FieldError error={fieldState.error} />
                </Field>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <Controller
                control={form.control}
                name="primaryColor"
                render={({ field, fieldState }) => (
                  <Field name={field.name} invalid={fieldState.invalid}>
                    <FieldLabel>Primary Color</FieldLabel>
                    <div className="flex gap-2">
                      <Input
                        {...field}
                        placeholder="#1a1a2e"
                        className="flex-1"
                      />
                      {field.value && (
                        <div
                          className="size-9 shrink-0 rounded-md border"
                          style={{ backgroundColor: field.value }}
                        />
                      )}
                    </div>
                    <FieldError error={fieldState.error} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="accentColor"
                render={({ field, fieldState }) => (
                  <Field name={field.name} invalid={fieldState.invalid}>
                    <FieldLabel>Accent Color</FieldLabel>
                    <div className="flex gap-2">
                      <Input
                        {...field}
                        placeholder="#e94560"
                        className="flex-1"
                      />
                      {field.value && (
                        <div
                          className="size-9 shrink-0 rounded-md border"
                          style={{ backgroundColor: field.value }}
                        />
                      )}
                    </div>
                    <FieldError error={fieldState.error} />
                  </Field>
                )}
              />
            </div>
          </form>
        </DialogPanel>
        <DialogFooter>
          <Button
            type="submit"
            form="create-org-form"
            disabled={isPending}
          >
            {isPending ? "Creating..." : "Create Organization"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
