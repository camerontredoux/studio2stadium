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
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
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
import { Switch } from "@/components/ui/switch";
import { toastManager } from "@/components/ui/toast-manager";
import { useAdminCheckInToggle } from "@/features/org/api/check-in-queries";
import { toastRosterMutationError } from "@/features/org/api/roster-mutation-error";
import {
  type RosterEntry,
  useDeleteRosters,
  useResendInvites,
  useSetRosterPaid,
  useUpdateRoster,
} from "@/features/org/api/roster-queries";
import { AttachAccountDialog } from "./attach-account-dialog";
import { LinkIcon, MailIcon, Trash2Icon } from "lucide-react";
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
  };
}

type RosterEntryWithCheckIn = RosterEntry & { checkedInAt?: string | null };

interface RosterDetailSheetProps {
  entry: RosterEntryWithCheckIn | null;
  orgSlug: string;
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkInEnabled?: boolean;
  freeTierEnabled?: boolean;
}

export function RosterDetailSheet({
  entry,
  orgSlug,
  eventId,
  open,
  onOpenChange,
  checkInEnabled = true,
  freeTierEnabled = false,
}: RosterDetailSheetProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [paid, setPaid] = useState(false);

  const updateMutation = useUpdateRoster();
  const deleteMutation = useDeleteRosters();
  const resendMutation = useResendInvites();
  const checkInMutation = useAdminCheckInToggle();
  const paidMutation = useSetRosterPaid();

  const isDancer = entry?.type === "dancer";
  const isActive = entry?.isRegistered ?? false;
  const isCheckedIn = !!(entry?.checkedInAt);
  const saving = updateMutation.isPending;

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: entry ? defaultsFromEntry(entry) : undefined,
  });

  useEffect(() => {
    if (open && entry) {
      reset(defaultsFromEntry(entry));
      setPaid(!!entry.paid);
    }
  }, [open, entry, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!entry || isActive) return;

    const body: Record<string, unknown> = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
    };
    if (isDancer) {
      body.bibNumber = data.bibNumber;
      body.profile = {
        gradYear: data.gradYear,
        gpa: data.gpa,
      };
    } else {
      body.organization = data.organization;
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
      toastRosterMutationError(err);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    try {
      await deleteMutation.mutateAsync({
        params: {
          path: { slug: orgSlug, id: eventId },
          // @ts-expect-error -- OpenAPI spec omits query params; backend reads via request.all()
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

  const handleCheckInToggle = async () => {
    if (!entry) return;
    try {
      await checkInMutation.mutateAsync({
        slug: orgSlug,
        eventId,
        rosterId: entry.id,
        currentlyCheckedIn: isCheckedIn,
      });
      toastManager.add({
        title: isCheckedIn ? "Check-in removed" : "Checked in",
        type: "success",
      });
    } catch {
      toastManager.add({ title: "Failed to update check-in", type: "error" });
    }
  };

  const handlePaidToggle = async (next: boolean) => {
    if (!entry) return;
    const prev = paid;
    setPaid(next); // optimistic
    try {
      await paidMutation.mutateAsync({
        params: { path: { slug: orgSlug, id: eventId, rosterId: entry.id } },
        body: { paid: next },
      });
      toastManager.add({
        title: next ? "Marked as paid" : "Marked as unpaid",
        description: isActive
          ? next
            ? "Full access restored."
            : "Access restricted to the limited experience."
          : undefined,
        type: "success",
      });
    } catch {
      setPaid(prev); // revert
      toastManager.add({ title: "Failed to update paid status", type: "error" });
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
                {entry.bibNumber && !isDancer && entry.organization && " · "}
                {!isDancer && entry.organization}
                {(entry.bibNumber || (!isDancer && entry.organization)) && " · "}
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
                This {isDancer ? "dancer" : "coach"} has registered and
                connected their profile. Admin edits are disabled.
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
                      <Input
                        {...field}
                        type="email"
                        value={field.value ?? ""}
                      />
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
                {!isDancer && (
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
                )}
              </fieldset>

              {isDancer && (
                <button
                  type="button"
                  className="flex items-center gap-2.5 rounded-md border border-blue-500/20 bg-blue-500/5 px-3 py-2.5 text-left transition-colors hover:bg-blue-500/10"
                  onClick={() => setAttachOpen(true)}
                >
                  <LinkIcon className="size-4 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-blue-400">
                      {isActive ? "Change Account" : "Attach to Account"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {isActive
                        ? "Link to a different user account"
                        : "Link this roster entry to an existing user"}
                    </p>
                  </div>
                </button>
              )}

              {/* Profile (dancers only) */}
              {isDancer && (
                <fieldset className="flex flex-col gap-4" disabled={isActive}>
                  <legend className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                    Profile
                  </legend>
                  <Controller
                    control={control}
                    name="gradYear"
                    render={({
                      field: { value, onChange, name },
                      fieldState,
                    }) => (
                      <Field name={name} invalid={fieldState.invalid}>
                        <FieldLabel>Grad year</FieldLabel>
                        <NumberField
                          format={{ useGrouping: false }}
                          value={value ?? undefined}
                          onValueChange={(val) => onChange(val ?? null)}
                          min={1900}
                          max={2100}
                        >
                          <NumberFieldGroup>
                            <NumberFieldInput
                              inputMode="numeric"
                              maxLength={4}
                              placeholder="Year"
                            />
                          </NumberFieldGroup>
                        </NumberField>
                        <FieldError error={fieldState.error} />
                      </Field>
                    )}
                  />
                  <Controller
                    control={control}
                    name="gpa"
                    render={({ field: { value, onChange, name }, fieldState }) => (
                      <Field name={name} invalid={fieldState.invalid}>
                        <FieldLabel>GPA</FieldLabel>
                        <NumberField
                          value={value ?? undefined}
                          onValueChange={(val) => onChange(val ?? null)}
                          min={0}
                          max={5}
                          step={0.1}
                        >
                          <NumberFieldGroup>
                            <NumberFieldDecrement />
                            <NumberFieldInput
                              inputMode="decimal"
                              placeholder="GPA"
                            />
                            <NumberFieldIncrement />
                          </NumberFieldGroup>
                        </NumberField>
                        <FieldError error={fieldState.error} />
                      </Field>
                    )}
                  />
                </fieldset>
              )}

              {freeTierEnabled && isDancer && (
                <div className="border-t pt-4">
                  <p className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wide">
                    Paid Access
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {paid ? "Paid" : "Unpaid"}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {isActive
                          ? paid
                            ? "Full S2S access with premium features."
                            : "Limited profile, YouTube-only video."
                          : "Applied when the dancer activates their account."}
                      </span>
                    </div>
                    <Switch
                      checked={paid}
                      onCheckedChange={handlePaidToggle}
                      disabled={paidMutation.isPending}
                      aria-label="Toggle paid status"
                    />
                  </div>
                </div>
              )}

              {checkInEnabled && (
                <div className="border-t pt-4">
                  <p className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wide">
                    Check-In
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      {isCheckedIn ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="inline-block size-1.5 rounded-full bg-green-500" />
                          Checked in
                        </span>
                      ) : (
                        <span className="text-muted-foreground inline-flex items-center gap-1.5">
                          <span className="bg-muted-foreground/50 inline-block size-1.5 rounded-full" />
                          Not checked in
                        </span>
                      )}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCheckInToggle}
                      disabled={checkInMutation.isPending}
                    >
                      {isCheckedIn ? "Undo Check-in" : "Check In"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-muted-foreground mb-3 text-xs">
                  Delete is permanent and cannot be undone.
                </p>
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
            </form>
          </SheetContent>
          <SheetFooter>
            <div className="flex w-full items-center justify-end gap-2">
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

      {/* Attach to account */}
      {isDancer && (
        <AttachAccountDialog
          open={attachOpen}
          onOpenChange={setAttachOpen}
          orgSlug={orgSlug}
          eventId={eventId}
          rosterId={entry.id}
          isRelink={isActive}
          onSuccess={() => onOpenChange(false)}
        />
      )}
    </>
  );
}
