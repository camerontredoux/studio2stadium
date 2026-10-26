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
import { Select } from "@/components/event/select";
import { toastManager } from "@/components/ui/toast-manager";
import {
  type RosterClaim,
  useResolveRosterClaim,
} from "@/features/org/api/roster-claim-queries";

import { shortAge } from "./age";
import { matchOptionGroups, soleNameMatch } from "./match-options";
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
  const [picked, setPicked] = useState<string | null>(null);
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
    }
  };

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
          <Select
            id="match-dancer"
            size="lg"
            options={groups}
            value={selected}
            onChange={setPicked}
            placeholder={
              dancers.isPending ? "Loading dancers…" : "Choose dancer…"
            }
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
          onClick={confirm}
        >
          {resolve.isPending ? "Switching…" : "Switch email"}
        </Button>
      </DialogFooter>
    </>
  );
}
