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
  "/_org/o/$orgSlug/_authenticated/admin/roster-claims"
)({
  component: RosterClaimsPage,
});

function initials(person: { firstName: string | null; lastName: string | null }) {
  return `${person.firstName?.[0] ?? ""}${person.lastName?.[0] ?? ""}`;
}

function fullName(person: { firstName: string | null; lastName: string | null }) {
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
        <p className="text-muted-foreground mb-4 max-w-2xl text-sm">
          Dancers who could not find their registration. This usually means the
          roster was uploaded with a parent&rsquo;s or studio&rsquo;s email, so
          the entry is linked to that account instead of hers. Match the request
          to the right roster entry to connect it.
        </p>

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
          <ul className="flex max-w-3xl flex-col gap-3">
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
  return (
    <li className="border-border rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <Avatar className="size-9">
          <AvatarImage src={claim.requester.avatarUrl ?? undefined} />
          <AvatarFallback className="text-xs">
            {initials(claim.requester)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{fullName(claim.requester)}</p>
          <p className="text-muted-foreground text-xs">
            {claim.requester.email}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Asked {formatDistanceToNow(new Date(claim.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>

      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="text-muted-foreground">Registered as</dt>
          <dd className="font-medium">
            {claim.claimed.firstName} {claim.claimed.lastName}
          </dd>
        </div>
        {claim.claimed.email && (
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Email used</dt>
            <dd className="font-medium">{claim.claimed.email}</dd>
          </div>
        )}
      </dl>

      {claim.note && (
        <p className="bg-muted/50 mt-3 rounded-md p-2.5 text-sm">{claim.note}</p>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onReject} disabled={rejecting}>
          {rejecting ? <Spinner label="Dismissing…" /> : "Dismiss"}
        </Button>
        <FindEntryButton
          claim={claim}
          orgSlug={orgSlug}
          eventId={eventId}
          onResolved={onResolved}
        />
      </div>
    </li>
  );
}

/**
 * Approving runs through the same guarded reassignment an admin would perform
 * by hand — the request records *why*, it is not a second way to move a roster
 * entry. The confirmation still names whoever currently holds it.
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
      <Button disabled title="Select an event first">
        Find roster entry
      </Button>
    );
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Find roster entry</Button>
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
