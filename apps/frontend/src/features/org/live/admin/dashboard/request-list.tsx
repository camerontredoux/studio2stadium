import { EnvelopeSimpleIcon, XIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { Button } from "@/components/event/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/event/dialog";
import { Icon } from "@/components/event/icon";
import { toastManager } from "@/components/ui/toast-manager";
import {
  type RosterClaim,
  useResolveRosterClaim,
} from "@/features/org/api/roster-claim-queries";

import { shortAge } from "./age";
import { MatchRequestDialog } from "./match-request-dialog";

function claimedName(claim: RosterClaim) {
  return `${claim.claimed.firstName} ${claim.claimed.lastName}`.trim();
}

/**
 * Pending roster requests as rows: the sign-in email, who they registered as,
 * their note, the age, "Dismiss" (with a confirm) and "Match" (the Match
 * dialog). Shared by the dashboard's Requests widget and the Requests page.
 */
export function RequestList({
  orgSlug,
  eventId,
  claims,
}: {
  orgSlug: string;
  eventId: string;
  /** Pending requests, newest first. */
  claims: RosterClaim[];
}) {
  const [matching, setMatching] = useState<RosterClaim | null>(null);
  const [dismissing, setDismissing] = useState<string | null>(null);
  const [confirmDismiss, setConfirmDismiss] = useState<RosterClaim | null>(
    null,
  );
  const resolve = useResolveRosterClaim();

  const dismiss = async (claim: RosterClaim) => {
    setDismissing(claim.id);
    try {
      await resolve.mutateAsync({
        params: { path: { slug: orgSlug, claimId: claim.id } },
        body: { action: "reject" },
      });
      toastManager.add({ title: "Request dismissed", type: "success" });
    } catch (err) {
      toastManager.add({
        title:
          (err as { message?: string })?.message ??
          "Couldn't dismiss the request.",
        type: "error",
      });
    } finally {
      setDismissing(null);
    }
  };

  return (
    <>
      <ul className="m-0 list-none p-0">
        {claims.map((claim) => {
          const name = claimedName(claim);
          return (
            <li
              key={claim.id}
              className="border-line text-fg-2 grid min-h-12 grid-cols-[16px_minmax(0,1fr)_auto_auto] items-center gap-x-(--space-10) border-b px-(--space-14) py-(--space-6) last:border-b-0"
            >
              <Icon icon={EnvelopeSimpleIcon} className="text-fg-3" />
              <span className="flex min-w-0 flex-col">
                <span className="text-fg truncate font-mono text-[12.5px] leading-[1.4]">
                  {claim.requester.email}
                </span>
                {name && (
                  <span className="text-fg-3 truncate text-[12px] leading-[1.4]">
                    Registered as {name}
                  </span>
                )}
              </span>
              <span className="text-fg-3 font-mono text-[11.5px] tabular-nums">
                {shortAge(claim.createdAt)}
              </span>
              <span className="flex items-center gap-(--space-4)">
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  label={`Dismiss request from ${claim.requester.email}`}
                  title="Dismiss"
                  disabled={dismissing === claim.id}
                  onClick={() => setConfirmDismiss(claim)}
                >
                  <Icon icon={XIcon} />
                </Button>
                <Button
                  size="sm"
                  aria-haspopup="dialog"
                  onClick={() => setMatching(claim)}
                >
                  Match
                </Button>
              </span>
            </li>
          );
        })}
      </ul>
      <Dialog
        open={confirmDismiss !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDismiss(null);
        }}
      >
        <DialogPopup role="alertdialog">
          <DialogHeader className="pb-(--space-16)">
            <DialogTitle>Dismiss this request?</DialogTitle>
            <DialogDescription>
              The request from{" "}
              <span className="text-fg font-mono">
                {confirmDismiss?.requester.email}
              </span>{" "}
              leaves the list without linking a roster row.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" size="lg" />}>
              Cancel
            </DialogClose>
            <Button
              variant="danger"
              size="lg"
              className="border-danger/40 hover:border-danger"
              onClick={() => {
                if (confirmDismiss) void dismiss(confirmDismiss);
                setConfirmDismiss(null);
              }}
            >
              Dismiss request
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
      <MatchRequestDialog
        orgSlug={orgSlug}
        eventId={eventId}
        claim={matching}
        onOpenChange={(open) => {
          if (!open) setMatching(null);
        }}
      />
    </>
  );
}
