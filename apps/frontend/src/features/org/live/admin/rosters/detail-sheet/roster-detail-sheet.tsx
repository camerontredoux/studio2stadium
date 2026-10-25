import {
  ArrowCounterClockwiseIcon,
  CheckIcon,
  LinkSimpleIcon,
  LockSimpleIcon,
  MegaphoneIcon,
  PaperPlaneTiltIcon,
  PlayCircleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type * as React from "react";

import { Button } from "@/components/event/button";
import { ChipRow } from "@/components/event/chip";
import { Icon } from "@/components/event/icon";
import { MenuItem } from "@/components/event/menu";
import { SplitButton } from "@/components/event/split-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BusyLabel } from "@/features/org/live/shared/busy-label";
import { toastManager } from "@/components/ui/toast-manager";
import { useAdminCheckInToggle } from "@/features/org/api/check-in-queries";
import {
  type RosterEntry,
  useDeleteRosters,
  useResendInvites,
  useSetRosterPaid,
  useUpdateRoster,
} from "@/features/org/api/roster-queries";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { useOrg } from "@/features/org/context/use-org";
import { DancerDialog } from "@/features/org/live/shared/dancer-dialog";
import {
  DetailSheet,
  DetailSheetFooter,
  DetailSheetForm,
  DetailSheetHeader,
  DetailSheetPrimary,
  DetailSheetRow,
  DetailSheetRows,
  DetailSheetSection,
  DetailSheetTile,
  DetailSheetValue,
} from "@/features/org/live/shared/detail-sheet";

import { AttachAccountDialog } from "./attach-account-dialog";
import { ConfirmDialog } from "@/features/org/live/shared/confirm-dialog";
import {
  buildRosterPatch,
  callbackChipLabel,
  callbackChipTitle,
  changedFields,
  checkInSummary,
  clockTime,
  editableFields,
  formFromEntry,
  initials,
  mapRosterSaveError,
  type RosterField,
  type RosterFieldErrors,
  type RosterFormValues,
  validateRosterFields,
} from "./roster-sheet-model";
import { SheetField } from "@/features/org/live/shared/sheet-field";

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

/**
 * The admin's roster entry sheet (Dancers and Coaches pages): a summary
 * header, the account, then Roster, This event and Profile sections, with
 * Remove / Cancel / Save in a sticky footer.
 */
export function RosterDetailSheet({ entry, ...props }: RosterDetailSheetProps) {
  // DetailSheet mounts closed and opens on the next frame, so the first open
  // animates.
  if (!entry) return null;
  return <RosterSheet entry={entry} {...props} />;
}

const FORM_ID = "roster-detail-form";

function RosterSheet({
  entry,
  orgSlug,
  eventId,
  open,
  onOpenChange,
  checkInEnabled = true,
  freeTierEnabled = false,
}: RosterDetailSheetProps & { entry: RosterEntryWithCheckIn }) {
  const { hasFeature } = useOrg();
  const isDancer = entry.type === "dancer";
  const isActive = entry.isRegistered;
  const checkedInAt = entry.checkedInAt ?? null;
  const showCheckIn = checkInEnabled && hasFeature("check_in");
  const showCallbacks = isDancer && hasFeature("callbacks");
  const showVideos = isDancer && hasFeature("video_library");
  const showPaid = isDancer && freeTierEnabled;

  const updateMutation = useUpdateRoster();
  const deleteMutation = useDeleteRosters();
  const resendMutation = useResendInvites();
  const checkInMutation = useAdminCheckInToggle();
  const paidMutation = useSetRosterPaid();

  const fields = editableFields(entry);
  const fresh = useMemo(() => formFromEntry(entry), [entry]);
  const [saved, setSaved] = useState<RosterFormValues>(fresh);
  const [values, setValues] = useState<RosterFormValues>(fresh);
  const [errors, setErrors] = useState<RosterFieldErrors>({});
  const dirtyFields = changedFields(saved, values, fields);
  const dirty = dirtyFields.length > 0;

  // Start from the entry each time the sheet opens or shows another entry.
  const openKey = open ? entry.id : null;
  const [syncedKey, setSyncedKey] = useState<string | null>(null);
  // Pick up outside changes (a refetch after save, an attached account) unless
  // the admin has unsaved edits.
  const [seenFresh, setSeenFresh] = useState(fresh);
  if (openKey !== syncedKey || (fresh !== seenFresh && !dirty)) {
    setSyncedKey(openKey);
    setSeenFresh(fresh);
    setSaved(fresh);
    setValues(fresh);
    if (openKey !== syncedKey) setErrors({});
  } else if (fresh !== seenFresh) {
    setSeenFresh(fresh);
  }

  const [removeOpen, setRemoveOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);

  // Optimistic paid state until the refetched entry agrees.
  const [paidOverride, setPaidOverride] = useState<boolean | null>(null);
  if (
    paidOverride !== null &&
    !paidMutation.isPending &&
    !!entry.paid === paidOverride
  ) {
    setPaidOverride(null);
  }
  const paid = paidOverride ?? !!entry.paid;

  const callbacksQuery = useQuery({
    ...scoutingQueries.dancerCallbackDetail(orgSlug, entry.id),
    enabled: open && showCallbacks,
  });

  const fullName = `${entry.firstName} ${entry.lastName}`.trim();

  const setField = (field: RosterField) => (value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const requestClose = () => {
    if (dirty) setDiscardOpen(true);
    else onOpenChange(false);
  };

  // Rendered inside the sheet so Base UI treats it as nested: interacting
  // with it doesn't count as a press outside the sheet.
  const [dancerOpen, setDancerOpen] = useState(false);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!dirty || updateMutation.isPending) return;
    const invalid = validateRosterFields(values, dirtyFields);
    if (Object.keys(invalid).length > 0) {
      setErrors(invalid);
      return;
    }
    try {
      await updateMutation.mutateAsync({
        params: { path: { slug: orgSlug, id: eventId, rosterId: entry.id } },
        body: buildRosterPatch(values, dirtyFields),
      });
      setSaved(values);
      setErrors({});
      toastManager.add({ title: "Changes saved", type: "success" });
    } catch (err) {
      const { fieldErrors, message } = mapRosterSaveError(err);
      setErrors(fieldErrors);
      toastManager.add({
        title: "Couldn't save changes",
        description: message,
        type: "error",
      });
    }
  };

  const handleRemove = async () => {
    try {
      await deleteMutation.mutateAsync({
        params: {
          path: { slug: orgSlug, id: eventId },
          // @ts-expect-error -- OpenAPI spec omits query params; backend reads via request.all()
          query: { ids: [entry.id] },
        },
      });
      toastManager.add({
        title: `${fullName} removed from the roster`,
        type: "success",
      });
      setRemoveOpen(false);
      onOpenChange(false);
    } catch {
      toastManager.add({ title: "Couldn't remove this entry", type: "error" });
    }
  };

  const handleResendInvite = async () => {
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
      toastManager.add({ title: "Couldn't resend the invite", type: "error" });
    }
  };

  const handleCheckInToggle = async () => {
    const wasCheckedIn = !!checkedInAt;
    try {
      await checkInMutation.mutateAsync({
        slug: orgSlug,
        eventId,
        rosterId: entry.id,
        currentlyCheckedIn: wasCheckedIn,
      });
      toastManager.add({
        title: wasCheckedIn ? "Check-in removed" : "Checked in",
        type: "success",
      });
    } catch {
      toastManager.add({ title: "Couldn't update check-in", type: "error" });
    }
  };

  const handlePaidToggle = async () => {
    const next = !paid;
    setPaidOverride(next);
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
      setPaidOverride(null);
      toastManager.add({ title: "Couldn't update paid status", type: "error" });
    }
  };

  const field = (name: RosterField) => ({
    value: values[name],
    onValueChange: setField(name),
    error: errors[name],
    name,
  });

  const linked = entry.linkedUser ?? null;
  const tileText =
    isDancer && entry.bibNumber != null
      ? String(entry.bibNumber)
      : initials(entry.firstName, entry.lastName);

  const eventRows = showCheckIn || showPaid || showCallbacks || showVideos;

  return (
    <DetailSheet
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : requestClose())}
      data-testid="roster-detail-sheet"
    >
      {/* Header: bib tile, name, status and check-in line, close. */}
      <DetailSheetHeader
        tile={
          <DetailSheetTile
            aria-hidden={isDancer && entry.bibNumber != null ? undefined : true}
            className={tileText.length > 3 ? "text-[18px]" : "text-[24px]"}
          >
            {isDancer && entry.bibNumber != null && (
              <span className="sr-only">Bib </span>
            )}
            {tileText}
          </DetailSheetTile>
        }
        title={fullName}
        meta={
          <>
            <span className={isActive ? "text-fg" : "text-fg-3"}>
              {isActive ? "Active" : "Pending"}
            </span>
            {showCheckIn ? (
              <> · {checkInSummary(checkedInAt)}</>
            ) : (
              !isDancer && entry.organization && <> · {entry.organization}</>
            )}
          </>
        }
        onClose={requestClose}
      />

      <DetailSheetForm id={FORM_ID} onSubmit={handleSave}>
        {/* Account */}
        <div
          data-testid="roster-account"
          className="flex items-center gap-(--space-12) px-(--space-16) py-(--space-14)"
        >
          <Avatar className="bg-surface-chip size-9 shrink-0">
            <AvatarImage src={linked?.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-surface-chip text-fg-2 type-meta">
              {initials(entry.firstName, entry.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="type-body text-fg truncate text-[13.5px]">
              {linked?.email ?? entry.email}
            </p>
            <p className="type-meta text-fg-3 truncate">
              {isActive ? "Linked account" : "Invite sent · not registered"}
            </p>
          </div>
          {isActive ? (
            isDancer && (
              <Button onClick={() => setAttachOpen(true)}>
                <Icon icon={LinkSimpleIcon} />
                Change
              </Button>
            )
          ) : isDancer ? (
            <SplitButton
              label="Resend invite"
              icon={PaperPlaneTiltIcon}
              onClick={handleResendInvite}
              disabled={resendMutation.isPending}
              menuLabel="More account actions"
            >
              <MenuItem
                icon={LinkSimpleIcon}
                onClick={() => setAttachOpen(true)}
              >
                Link an existing account
              </MenuItem>
            </SplitButton>
          ) : (
            <Button
              onClick={handleResendInvite}
              disabled={resendMutation.isPending}
            >
              <Icon icon={PaperPlaneTiltIcon} />
              Resend invite
            </Button>
          )}
        </div>

        {fields.length > 0 && (
          <DetailSheetSection title="Roster">
            {isDancer && (
              <SheetField
                label="Bib number"
                inputMode="numeric"
                autoComplete="off"
                mono
                className="w-[120px]"
                {...field("bibNumber")}
              />
            )}
            {!isActive && (
              <>
                <div className="grid grid-cols-2 gap-(--space-12)">
                  <SheetField
                    label="First name"
                    autoComplete="off"
                    {...field("firstName")}
                  />
                  <SheetField
                    label="Last name"
                    autoComplete="off"
                    {...field("lastName")}
                  />
                </div>
                <SheetField
                  label="Email"
                  type="email"
                  autoComplete="off"
                  {...field("email")}
                />
                {!isDancer && (
                  <SheetField
                    label="School"
                    autoComplete="off"
                    {...field("organization")}
                  />
                )}
              </>
            )}
          </DetailSheetSection>
        )}

        {eventRows && (
          <DetailSheetSection title="This event">
            <DetailSheetRows>
              {showCheckIn && (
                <DetailSheetRow label="Check-in">
                  {checkedInAt ? (
                    <span className="type-data text-fg flex items-center gap-(--space-6)">
                      <Icon icon={CheckIcon} />
                      {clockTime(checkedInAt)}
                    </span>
                  ) : (
                    <span className="type-body text-fg-3">Not yet</span>
                  )}
                  <Button
                    size="sm"
                    variant={checkedInAt ? "ghost" : "secondary"}
                    onClick={handleCheckInToggle}
                    disabled={checkInMutation.isPending}
                    className="ms-auto"
                  >
                    {checkedInAt && <Icon icon={ArrowCounterClockwiseIcon} />}
                    {checkedInAt ? "Undo" : "Check in"}
                  </Button>
                </DetailSheetRow>
              )}
              {showPaid && (
                <DetailSheetRow label="Access">
                  <span className="flex min-w-0 flex-col">
                    <span className="type-body text-fg">
                      {paid ? "Paid" : "Unpaid"}
                    </span>
                    <span className="type-caption text-fg-3">
                      {isActive
                        ? paid
                          ? "Full organization access."
                          : "Limited profile, YouTube-only video."
                        : "Applies when the dancer registers."}
                    </span>
                  </span>
                  <Button
                    size="sm"
                    onClick={handlePaidToggle}
                    disabled={paidMutation.isPending}
                    className="ms-auto"
                  >
                    {paid ? "Mark unpaid" : "Mark paid"}
                  </Button>
                </DetailSheetRow>
              )}
              {showCallbacks && (
                <DetailSheetRow label="Callbacks">
                  {callbacksQuery.isPending ? (
                    <span className="type-body text-fg-3">Loading…</span>
                  ) : callbacksQuery.isError ? (
                    <span className="type-body text-fg-3">
                      Couldn&rsquo;t load callbacks
                    </span>
                  ) : callbacksQuery.data.length === 0 ? (
                    <span className="type-body text-fg-3">None</span>
                  ) : (
                    <ChipRow className="bp-phone:flex-wrap">
                      {callbacksQuery.data.map((callback) => (
                        <Button
                          key={callback.coachRosterId}
                          onClick={() => setDancerOpen(true)}
                          title={callbackChipTitle(callback)}
                          className="max-w-full"
                        >
                          <Icon icon={MegaphoneIcon} />
                          <span className="truncate">
                            {callbackChipLabel(callback)}
                          </span>
                        </Button>
                      ))}
                    </ChipRow>
                  )}
                </DetailSheetRow>
              )}
              {showVideos && (
                <DetailSheetRow label="Videos">
                  <span className="type-body text-fg-3 flex items-center gap-(--space-6)">
                    <Icon icon={PlayCircleIcon} />
                    Coming soon
                  </span>
                </DetailSheetRow>
              )}
            </DetailSheetRows>
          </DetailSheetSection>
        )}

        {isDancer ? (
          <DetailSheetSection
            title="Profile"
            aside={
              isActive && (
                <span className="type-meta text-fg-3 flex items-center gap-(--space-6)">
                  <Icon icon={LockSimpleIcon} />
                  Managed by dancer
                </span>
              )
            }
          >
            {isActive ? (
              <DetailSheetRows>
                <DetailSheetRow label="Grad year">
                  <DetailSheetValue mono value={entry.profile?.gradYear} />
                </DetailSheetRow>
                <DetailSheetRow label="Studio">
                  <DetailSheetValue value={entry.profile?.studio} />
                </DetailSheetRow>
                <DetailSheetRow label="GPA">
                  <DetailSheetValue
                    mono
                    value={entry.profile?.gpa?.toFixed(1)}
                  />
                </DetailSheetRow>
              </DetailSheetRows>
            ) : (
              <div className="grid grid-cols-2 gap-(--space-12)">
                <SheetField
                  label="Grad year"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Year"
                  autoComplete="off"
                  mono
                  {...field("gradYear")}
                />
                <SheetField
                  label="GPA"
                  inputMode="decimal"
                  placeholder="0.0 to 5.0"
                  autoComplete="off"
                  mono
                  {...field("gpa")}
                />
              </div>
            )}
          </DetailSheetSection>
        ) : (
          isActive && (
            <DetailSheetSection
              title="Profile"
              aside={
                <span className="type-meta text-fg-3 flex items-center gap-(--space-6)">
                  <Icon icon={LockSimpleIcon} />
                  Managed by coach
                </span>
              }
            >
              <DetailSheetRows>
                <DetailSheetRow label="School">
                  <DetailSheetValue value={entry.organization} />
                </DetailSheetRow>
              </DetailSheetRows>
            </DetailSheetSection>
          )
        )}
      </DetailSheetForm>

      <DetailSheetFooter>
        <Button
          variant="danger"
          size="lg"
          onClick={() => setRemoveOpen(true)}
          className="-ms-(--space-8)"
        >
          <Icon icon={TrashIcon} />
          Remove
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={requestClose}
          className="ms-auto"
        >
          {fields.length > 0 ? "Cancel" : "Close"}
        </Button>
        {fields.length > 0 && (
          <DetailSheetPrimary
            type="submit"
            form={FORM_ID}
            disabled={!dirty || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <BusyLabel label="Saving…" />
            ) : (
              "Save changes"
            )}
          </DetailSheetPrimary>
        )}
      </DetailSheetFooter>

      <ConfirmDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        title="Remove from roster?"
        description={
          <>
            Remove {fullName} from this event&rsquo;s roster? This can&rsquo;t
            be undone.
          </>
        }
        confirmLabel="Remove"
        onConfirm={handleRemove}
        pending={deleteMutation.isPending}
      />
      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title="Discard changes?"
        description={<>Your edits to {fullName} won&rsquo;t be saved.</>}
        cancelLabel="Keep editing"
        confirmLabel="Discard"
        onConfirm={() => {
          setDiscardOpen(false);
          setValues(saved);
          setErrors({});
          onOpenChange(false);
        }}
      />
      {showCallbacks && (
        <DancerDialog
          viewer="admin"
          open={dancerOpen}
          onOpenChange={setDancerOpen}
          eventId={eventId}
          dancer={{
            rosterId: entry.id,
            eventId,
            bibNumber: entry.bibNumber,
            firstName: entry.firstName,
            lastName: entry.lastName,
            email: entry.email,
            studio: entry.profile?.studio,
            gradYear: entry.profile?.gradYear,
            gpa: entry.profile?.gpa,
            state: entry.profile?.state,
            height: entry.profile?.height,
            danceStyles: entry.profile?.danceStyles,
            profilePhotoUrl: entry.profile?.profilePhotoUrl,
            checkedInAt,
            isRegistered: entry.isRegistered,
          }}
        />
      )}
      {isDancer && (
        <AttachAccountDialog
          open={attachOpen}
          onOpenChange={setAttachOpen}
          orgSlug={orgSlug}
          eventId={eventId}
          rosterId={entry.id}
          isRelink={isActive}
          linkedUser={linked}
          onSuccess={() => onOpenChange(false)}
        />
      )}
    </DetailSheet>
  );
}
