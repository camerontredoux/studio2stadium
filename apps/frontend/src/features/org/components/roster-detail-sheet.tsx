import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast-manager";
import {
  type RosterEntry,
  useDeleteRosters,
  useResendInvites,
  useUpdateRoster,
} from "@/features/org/api/roster-queries";
import { MailIcon, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  bibNumber: number | null;
  organization: string | null;
  gradYear: number | null;
  gpa: number | null;
  studio: string | null;
  state: string | null;
  height: string | null;
  danceStyles: string | null;
  bio: string | null;
};

function defaultsFromEntry(entry: RosterEntry): FormValues {
  return {
    firstName: entry.firstName,
    lastName: entry.lastName,
    email: entry.email,
    bibNumber: entry.bibNumber,
    organization: entry.organization,
    gradYear: entry.profile?.gradYear ?? null,
    gpa: entry.profile?.gpa ?? null,
    studio: entry.profile?.studio ?? null,
    state: entry.profile?.state ?? null,
    height: entry.profile?.height ?? null,
    danceStyles: entry.profile?.danceStyles?.join(", ") ?? null,
    bio: entry.profile?.bio ?? null,
  };
}

interface RosterDetailSheetProps {
  entry: RosterEntry | null;
  orgSlug: string;
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RosterDetailSheet({
  entry,
  orgSlug,
  eventId,
  open,
  onOpenChange,
}: RosterDetailSheetProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  const updateMutation = useUpdateRoster();
  const deleteMutation = useDeleteRosters();
  const resendMutation = useResendInvites();

  const isDancer = entry?.type === "dancer";
  const isActive = entry?.isRegistered ?? false;
  const saving = updateMutation.isPending;

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: entry ? defaultsFromEntry(entry) : undefined,
  });

  useEffect(() => {
    if (open && entry) {
      reset(defaultsFromEntry(entry));
    }
  }, [open, entry, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!entry || isActive) return;

    const danceStylesArr = data.danceStyles
      ? data.danceStyles
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : null;

    const body: Record<string, unknown> = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      organization: data.organization,
    };
    if (isDancer) {
      body.bibNumber = data.bibNumber;
      body.profile = {
        gradYear: data.gradYear,
        gpa: data.gpa,
        studio: data.studio,
        state: data.state,
        height: data.height,
        danceStyles: danceStylesArr,
        bio: data.bio,
      };
    }

    try {
      await updateMutation.mutateAsync({
        params: { path: { slug: orgSlug, id: eventId, rosterId: entry.id } },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body: body as any,
      });
      toastManager.add({ title: "Entry updated", type: "success" });
      onOpenChange(false);
    } catch (err) {
      const code = (err as { data?: { code?: string } })?.data?.code;
      if (code === "ROSTER_ACTIVE_READONLY") {
        toastManager.add({
          title: "Can't edit an active roster entry",
          type: "error",
        });
      } else if (code === "ROSTER_EMAIL_CONFLICT") {
        toastManager.add({
          title: "That email is already on this roster",
          type: "error",
        });
      } else if (code === "ROSTER_BIB_CONFLICT") {
        toastManager.add({
          title: "That bib number is already in use",
          type: "error",
        });
      } else {
        toastManager.add({ title: "Failed to save", type: "error" });
      }
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    try {
      await deleteMutation.mutateAsync({
        params: {
          path: { slug: orgSlug, id: eventId },
          query: { ids: [entry.id] },
        },
      });
      toastManager.add({ title: "Entry deleted", type: "success" });
      setDeleteOpen(false);
      onOpenChange(false);
    } catch {
      toastManager.add({ title: "Failed to delete", type: "error" });
    }
  };

  const handleResendInvite = async () => {
    if (!entry || entry.type !== "dancer") return;
    try {
      const result = await resendMutation.mutateAsync({
        params: { path: { slug: orgSlug, id: eventId } },
        body: { ids: [entry.id] },
      });
      if (result.sent === 1) {
        toastManager.add({
          title: "Invite resent",
          description: `Invitation resent to ${entry.email}`,
          type: "success",
        });
      } else if (result.failed.length > 0) {
        toastManager.add({
          title: result.failed[0]?.reason ?? "Resend failed",
          type: "error",
        });
      } else {
        toastManager.add({ title: "Invite was skipped", type: "warning" });
      }
    } catch {
      toastManager.add({ title: "Failed to resend invite", type: "error" });
    }
  };

  if (!entry) return null;

  const FORM_ID = "roster-detail-form";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetPopup variant="inset">
          <SheetHeader>
            <SheetTitle>
              {entry.firstName} {entry.lastName}
            </SheetTitle>
            <SheetDescription>
              <span className="flex items-center gap-2">
                {entry.bibNumber && `Bib #${entry.bibNumber}`}
                {entry.bibNumber && entry.organization && " · "}
                {entry.organization}
                {(entry.bibNumber || entry.organization) && " · "}
                <Badge
                  variant={entry.isRegistered ? "success" : "outline"}
                  size="sm"
                >
                  {entry.isRegistered ? "Active" : "Pending"}
                </Badge>
              </span>
            </SheetDescription>
          </SheetHeader>
          <SheetContent>
            {isActive && (
              <div className="mx-4 mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                This {isDancer ? "dancer" : "coach"} has registered and connected
                their profile. Admin edits are disabled.
              </div>
            )}
            <form
              id={FORM_ID}
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-6 px-4 pt-2 pb-4"
            >
              {/* Roster Info */}
              <fieldset className="flex flex-col gap-4" disabled={isActive}>
                <legend className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                  Roster Info
                </legend>
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field, fieldState }) => (
                    <Field name={field.name} invalid={fieldState.invalid}>
                      <FieldLabel>First name</FieldLabel>
                      <Input {...field} value={field.value ?? ""} />
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
                      <Input {...field} value={field.value ?? ""} />
                      <FieldError error={fieldState.error} />
                    </Field>
                  )}
                />
                <Controller
                  control={control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <Field name={field.name} invalid={fieldState.invalid}>
                      <FieldLabel>Email</FieldLabel>
                      <Input {...field} type="email" value={field.value ?? ""} />
                      <FieldError error={fieldState.error} />
                    </Field>
                  )}
                />
                {isDancer && (
                  <Controller
                    control={control}
                    name="bibNumber"
                    render={({ field, fieldState }) => (
                      <Field name={field.name} invalid={fieldState.invalid}>
                        <FieldLabel>Bib number</FieldLabel>
                        <Input
                          {...field}
                          type="number"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              (e.target as HTMLInputElement).value
                                ? Number((e.target as HTMLInputElement).value)
                                : null,
                            )
                          }
                        />
                        <FieldError error={fieldState.error} />
                      </Field>
                    )}
                  />
                )}
                <Controller
                  control={control}
                  name="organization"
                  render={({ field, fieldState }) => (
                    <Field name={field.name} invalid={fieldState.invalid}>
                      <FieldLabel>Organization</FieldLabel>
                      <Input {...field} value={field.value ?? ""} />
                      <FieldError error={fieldState.error} />
                    </Field>
                  )}
                />
              </fieldset>

              {/* Profile (dancers only) */}
              {isDancer && (
                <fieldset className="flex flex-col gap-4" disabled={isActive}>
                  <legend className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                    Profile
                  </legend>
                  <Controller
                    control={control}
                    name="gradYear"
                    render={({ field, fieldState }) => (
                      <Field name={field.name} invalid={fieldState.invalid}>
                        <FieldLabel>Grad year</FieldLabel>
                        <Input
                          {...field}
                          type="number"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              (e.target as HTMLInputElement).value
                                ? Number((e.target as HTMLInputElement).value)
                                : null,
                            )
                          }
                        />
                        <FieldError error={fieldState.error} />
                      </Field>
                    )}
                  />
                  <Controller
                    control={control}
                    name="gpa"
                    render={({ field, fieldState }) => (
                      <Field name={field.name} invalid={fieldState.invalid}>
                        <FieldLabel>GPA</FieldLabel>
                        <Input
                          {...field}
                          type="number"
                          step="0.1"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              (e.target as HTMLInputElement).value
                                ? Number((e.target as HTMLInputElement).value)
                                : null,
                            )
                          }
                        />
                        <FieldError error={fieldState.error} />
                      </Field>
                    )}
                  />
                  <Controller
                    control={control}
                    name="studio"
                    render={({ field, fieldState }) => (
                      <Field name={field.name} invalid={fieldState.invalid}>
                        <FieldLabel>Studio</FieldLabel>
                        <Input {...field} value={field.value ?? ""} />
                        <FieldError error={fieldState.error} />
                      </Field>
                    )}
                  />
                  <Controller
                    control={control}
                    name="state"
                    render={({ field, fieldState }) => (
                      <Field name={field.name} invalid={fieldState.invalid}>
                        <FieldLabel>State</FieldLabel>
                        <Input {...field} value={field.value ?? ""} />
                        <FieldError error={fieldState.error} />
                      </Field>
                    )}
                  />
                  <Controller
                    control={control}
                    name="height"
                    render={({ field, fieldState }) => (
                      <Field name={field.name} invalid={fieldState.invalid}>
                        <FieldLabel>Height</FieldLabel>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder={`5'6"`}
                        />
                        <FieldError error={fieldState.error} />
                      </Field>
                    )}
                  />
                  <Controller
                    control={control}
                    name="danceStyles"
                    render={({ field, fieldState }) => (
                      <Field name={field.name} invalid={fieldState.invalid}>
                        <FieldLabel>Dance styles</FieldLabel>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Jazz, Contemporary, Hip Hop"
                        />
                        <FieldError error={fieldState.error} />
                      </Field>
                    )}
                  />
                  <Controller
                    control={control}
                    name="bio"
                    render={({ field, fieldState }) => (
                      <Field name={field.name} invalid={fieldState.invalid}>
                        <FieldLabel>Bio</FieldLabel>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          rows={3}
                        />
                        <FieldError error={fieldState.error} />
                      </Field>
                    )}
                  />
                </fieldset>
              )}
            </form>
          </SheetContent>
          <SheetFooter>
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                {!isActive && isDancer && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResendInvite}
                    disabled={resendMutation.isPending}
                  >
                    <MailIcon className="size-4" />
                    Resend invite
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2Icon className="size-4" />
                  Delete
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <SheetClose render={<Button variant="ghost" />}>
                  Cancel
                </SheetClose>
                {!isActive && (
                  <Button type="submit" form={FORM_ID} disabled={saving}>
                    {saving ? <Spinner label="Saving..." /> : "Save changes"}
                  </Button>
                )}
              </div>
            </div>
          </SheetFooter>
        </SheetPopup>
      </Sheet>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Delete roster entry</DialogTitle>
            <DialogDescription>
              Remove {entry.firstName} {entry.lastName} from the roster? This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </>
  );
}
