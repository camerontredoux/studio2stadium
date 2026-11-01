import {
  EnvelopeSimpleIcon,
  UserIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";

import { Button } from "@/components/event/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogReadout,
  DialogTitle,
} from "@/components/event/dialog";
import { Icon } from "@/components/event/icon";
import { Label } from "@/components/event/label";
import { Combobox } from "@/components/event/combobox";
import { toastManager } from "@/components/ui/toast-manager";
import {
  type RosterClaim,
  useResolveRosterClaim,
} from "@/features/org/api/roster-claim-queries";
import { ConfirmDialog } from "@/features/org/live/shared/confirm-dialog";

import { shortAge } from "./age";
import {
  comboboxGroups,
  matchOptionGroups,
  soleNameMatch,
} from "./match-options";
import { useEventDancers } from "./use-event-dancers";

/**
 * "Match sign-in to a dancer" (Main.dc.html L1141): the signed-in email, the name
 * they registered under, and a dancer row picker. "Switch email" approves the
 * request against that row, which moves the row to the signed-in account.
 */
export function MatchRequestDialog({
  orgSlug,
  eventId,
  claim,
  onOpenChange,
}: {
  orgSlug: string;
  eventId: string;
  /** The request being matched; `null` closes the dialog. */
  claim: RosterClaim | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={claim !== null} onOpenChange={onOpenChange}>
      <DialogPopup>
        {claim && (
          // Keyed so the picked row resets per request.
          <MatchForm
            key={claim.id}
            orgSlug={orgSlug}
            eventId={eventId}
            claim={claim}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogPopup>
    </Dialog>
  );
}

function MatchForm({
  orgSlug,
  eventId,
  claim,
  onDone,
}: {
  orgSlug: string;
  eventId: string;
  claim: RosterClaim;
  onDone: () => void;
}) {
  const dancers = useEventDancers(orgSlug, eventId, true);
  const groups = useMemo(
    () => matchOptionGroups(dancers.data ?? [], claim.claimed),
    [dancers.data, claim.claimed],
  );
  const labels = useMemo(
    () =>
      new Map(
        groups.flatMap((group) =>
          group.options.map((option) => [option.value, option.label] as const),
        ),
      ),
    [groups],
  );
  const [picked, setPicked] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  // Preselect the only row whose name matches, until the admin picks one.
  const selected = picked ?? soleNameMatch(groups);
  const entry = dancers.data?.find((dancer) => dancer.id === selected);
  const resolve = useResolveRosterClaim();

  const claimedName =
    `${claim.claimed.firstName} ${claim.claimed.lastName}`.trim();
  const linked = entry?.linkedUser;
  const linkedElsewhere = linked != null && linked.id !== claim.requester.id;

  const confirm = async () => {
    if (!entry) return;
    try {
      await resolve.mutateAsync({
        params: { path: { slug: orgSlug, claimId: claim.id } },
        body: { action: "approve", rosterId: entry.id },
      });
      toastManager.add({
        title: `Matched to ${entry.firstName} ${entry.lastName}`,
        type: "success",
      });
      setConfirming(false);
      onDone();
    } catch (err) {
      const e = err as { code?: string; message?: string };
      toastManager.add({
        title:
          e?.code === "DUPLICATE_ROSTER"
            ? "That account already has another entry for this event."
            : (e?.message ?? "Couldn't match the request."),
        type: "error",
      });
      setConfirming(false);
    }
  };

  const requesterName = [claim.requester.firstName, claim.requester.lastName]
    .filter(Boolean)
    .join(" ");
  const linkedName = [linked?.firstName, linked?.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <DialogHeader>
        <DialogTitle>Match sign-in to a dancer</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <div className="flex flex-col gap-(--space-6)">
          <Label>Signed in as</Label>
          <DialogReadout
            icon={EnvelopeSimpleIcon}
            note={shortAge(claim.createdAt)}
          >
            {claim.requester.email}
          </DialogReadout>
        </div>
        <div className="flex flex-col gap-(--space-6)">
          <Label>Registered as</Label>
          <DialogReadout
            icon={UserIcon}
            note={claim.claimed.email ?? undefined}
          >
            {claimedName || "—"}
          </DialogReadout>
          {claim.note && (
            <p className="text-fg-2 m-0 text-[12.5px] leading-[1.5]">
              “{claim.note}”
            </p>
          )}
        </div>
        <div className="flex flex-col gap-(--space-6)">
          <Label render={<label htmlFor="match-dancer" />}>Dancer row</Label>
          <Combobox
            id="match-dancer"
            size="lg"
            options={comboboxGroups(groups)}
            optionLabel={(id) => labels.get(id) ?? id}
            value={selected}
            onChange={setPicked}
            placeholder={
              dancers.isPending ? "Loading dancers…" : "Choose dancer…"
            }
            searchPlaceholder="Search by name or email"
            emptyText="No dancers match"
            listLabel="Dancer rows"
            disabled={dancers.isPending || groups.length === 0}
          />
          {dancers.isError && (
            <p className="text-danger m-0 text-[12.5px]">
              Couldn't load the dancer roster.
            </p>
          )}
          {!dancers.isPending && groups.length === 0 && (
            <p className="text-fg-3 m-0 text-[12.5px]">
              This event has no dancers on its roster yet.
            </p>
          )}
        </div>
        {linkedElsewhere && (
          <div
            role="note"
            className="border-danger/40 text-fg-2 flex gap-(--space-8) rounded-(--radius-6) border px-(--space-10) py-(--space-8) text-[12.5px] leading-[1.5]"
          >
            <Icon
              icon={WarningIcon}
              className="text-danger mt-[2px] shrink-0"
            />
            <span>
              This row is already linked to{" "}
              <span className="text-fg font-mono">{linked.email}</span>.
              Switching unregisters that account from the event and drops any
              callbacks it received.
            </span>
          </div>
        )}
      </DialogBody>
      <DialogFooter>
        <DialogClose render={<Button variant="ghost" size="lg" />}>
          Cancel
        </DialogClose>
        <Button
          variant="primary"
          size="lg"
          disabled={!entry || resolve.isPending}
          onClick={() => setConfirming(true)}
        >
          Switch email
        </Button>
      </DialogFooter>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Move this dancer to the new account?"
        description={
          <>
            <span className="block">
              {entry?.firstName} {entry?.lastName} will move from one account to
              another.
            </span>
            <span className="border-line bg-bg-300 mt-(--space-10) flex flex-col gap-(--space-8) rounded-(--radius-6) border p-(--space-10)">
              <AccountLine
                heading="From"
                name={linkedName}
                email={linked?.email}
                empty="No account linked"
              />
              <AccountLine
                heading="To"
                name={requesterName}
                email={claim.requester.email}
              />
            </span>
            {linkedElsewhere && (
              <span className="text-danger mt-(--space-10) block">
                This unregisters the current account from the event and drops
                any callbacks it received.
              </span>
            )}
          </>
        }
        confirmLabel={resolve.isPending ? "Switching…" : "Switch email"}
        variant={linkedElsewhere ? "danger" : "primary"}
        onConfirm={confirm}
        pending={resolve.isPending}
      />
    </>
  );
}

function AccountLine({
  heading,
  name,
  email,
  empty,
}: {
  heading: string;
  name: string;
  email?: string;
  empty?: string;
}) {
  return (
    <span className="flex min-w-0 flex-col gap-(--space-2)">
      <span className="type-meta text-fg-3">{heading}</span>
      {email ? (
        <>
          {name && (
            <span className="type-body-strong text-fg truncate">{name}</span>
          )}
          <span className="type-caption text-fg-2 break-all">{email}</span>
        </>
      ) : (
        <span className="type-body text-fg-3">{empty}</span>
      )}
    </span>
  );
}
