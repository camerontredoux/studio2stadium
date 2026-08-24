import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import {
  rosterClaimQueries,
  useResolveRosterClaim,
  type RosterClaim,
} from "@/features/org/api/roster-claim-queries";
import { ResolveClaimDialog } from "@/features/org/components/resolve-claim-dialog";
import { useAdminEvent } from "@/features/org/context/use-admin-event";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { InboxIcon } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/admin/roster-claims",
)({
  component: RosterClaimsPage,
});

function initials(person: {
  firstName: string | null;
  lastName: string | null;
}) {
  return `${person.firstName?.[0] ?? ""}${person.lastName?.[0] ?? ""}`;
}

function fullName(person: {
  firstName: string | null;
  lastName: string | null;
}) {
  return [person.firstName, person.lastName].filter(Boolean).join(" ");
}

function RosterClaimsPage() {
  const { orgSlug } = Route.useParams();
  const { selectedEvent } = useAdminEvent();
  const [rejecting, setRejecting] = useState<string | null>(null);

  const claims = useQuery(rosterClaimQueries.pending(orgSlug));
  const resolve = useResolveRosterClaim();

  const handleReject = async (claim: RosterClaim) => {
    setRejecting(claim.id);
    try {
      await resolve.mutateAsync({
        params: { path: { slug: orgSlug, claimId: claim.id } },
        body: { action: "reject" },
      });
      toastManager.add({ title: "Request dismissed", type: "success" });
      await claims.refetch();
    } catch (err) {
      toastManager.add({
        title:
          (err as { message?: string })?.message ??
          "Could not dismiss the request.",
        type: "error",
      });
    } finally {
      setRejecting(null);
    }
  };

  const rows = claims.data?.data ?? [];

  return (
    <div className="flex h-full flex-col">
      <header className="border-border flex shrink-0 items-baseline gap-2 border-b px-4 py-3">
        <h1 className="text-lg font-semibold">Roster Requests</h1>
        <span className="text-muted-foreground text-sm">
          {selectedEvent?.name ?? ""}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {claims.isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner label="Loading requests..." />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-center">
            <InboxIcon className="size-8" />
            <p className="text-sm">No pending requests.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((claim) => (
              <ClaimCard
                key={claim.id}
                claim={claim}
                orgSlug={orgSlug}
                eventId={selectedEvent?.id ?? null}
                rejecting={rejecting === claim.id}
                onReject={() => handleReject(claim)}
                onResolved={() => claims.refetch()}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ClaimCard({
  claim,
  orgSlug,
  eventId,
  rejecting,
  onReject,
  onResolved,
}: {
  claim: RosterClaim;
  orgSlug: string;
  eventId: string | null;
  rejecting: boolean;
  onReject: () => void;
  onResolved: () => void;
}) {
  const [confirmDismiss, setConfirmDismiss] = useState(false);

  return (
    <li className="border-border rounded-lg border px-3 py-2.5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
        <div className="flex min-w-0 items-center gap-2.5 md:w-64 md:shrink-0">
          <Avatar className="size-8 shrink-0">
            <AvatarImage src={claim.requester.avatarUrl ?? undefined} />
            <AvatarFallback className="text-xs">
              {initials(claim.requester)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {fullName(claim.requester)}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {claim.requester.email} ·{" "}
              {formatDistanceToNow(new Date(claim.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>

        <dl className="min-w-0 flex-1 md:pl-4">
          <dt className="text-foreground text-xs font-medium">Registered as</dt>
          <dd className="truncate text-sm">
            <span className="font-medium">
              {claim.claimed.firstName} {claim.claimed.lastName}
            </span>
            {claim.claimed.email && (
              <span className="text-muted-foreground">
                {" "}
                · {claim.claimed.email}
              </span>
            )}
          </dd>
        </dl>

        <div className="flex shrink-0 gap-2 md:justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDismiss(true)}
            disabled={rejecting}
          >
            {rejecting ? <Spinner label="Dismissing…" /> : "Dismiss"}
          </Button>
          <FindEntryButton
            claim={claim}
            orgSlug={orgSlug}
            eventId={eventId}
            onResolved={onResolved}
          />
        </div>
      </div>

      {claim.note && (
        <p className="bg-muted/50 mt-2 rounded-md px-2.5 py-1.5 text-sm">
          <span className="text-muted-foreground">Note: </span>
          {claim.note}
        </p>
      )}

      <AlertDialog open={confirmDismiss} onOpenChange={setConfirmDismiss}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Dismiss this request?</AlertDialogTitle>
            <AlertDialogDescription>
              This request will be removed from the list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>
              Cancel
            </AlertDialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmDismiss(false);
                onReject();
              }}
              disabled={rejecting}
            >
              Dismiss request
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </li>
  );
}

/**
 * Approving runs through the same guarded reassignment an admin would perform
 * by hand. The request records why it happened, it is not a second way to move
 * a roster entry. The confirmation still names whoever currently holds it.
 */
function FindEntryButton({
  claim,
  orgSlug,
  eventId,
  onResolved,
}: {
  claim: RosterClaim;
  orgSlug: string;
  eventId: string | null;
  onResolved: () => void;
}) {
  const [open, setOpen] = useState(false);

  if (!eventId) {
    return (
      <Button disabled size="sm" title="Select an event first">
        Find roster entry
      </Button>
    );
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Find roster entry
      </Button>
      {open && (
        <ResolveClaimDialog
          open={open}
          onOpenChange={setOpen}
          orgSlug={orgSlug}
          eventId={eventId}
          claim={claim}
          onSuccess={onResolved}
        />
      )}
    </>
  );
}
