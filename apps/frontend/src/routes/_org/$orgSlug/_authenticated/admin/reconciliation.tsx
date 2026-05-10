import { client } from "@/lib/api/client";
import { adminQueries } from "@/features/org/api/admin-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toastManager } from "@/components/ui/toast-manager";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/admin/reconciliation",
)({
  component: ReconciliationPage,
});

type InviteRow = {
  id: string;
  email: string;
  organization: string | null;
  token: string;
  expiresAt: string;
  consumedAt: string | null;
  createdAt: string;
};

type OrphanRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organization: string | null;
};

type SchoolUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

async function fetchReconciliation(
  slug: string,
  eventId: string,
): Promise<{ invites: InviteRow[]; orphanRosters: OrphanRow[] }> {
  const res = await (
    client as unknown as Record<
      string,
      (p: string) => Promise<{
        data: { invites: InviteRow[]; orphanRosters: OrphanRow[] };
      }>
    >
  )["GET"](`/orgs/${slug}/events/${eventId}/reconciliation`);
  return res.data;
}

async function fetchSchoolUsers(
  slug: string,
  eventId: string,
  q: string,
): Promise<SchoolUser[]> {
  const res = await (
    client as unknown as Record<
      string,
      (p: string) => Promise<{ data: SchoolUser[] }>
    >
  )["GET"](
    `/orgs/${slug}/events/${eventId}/reconciliation/school-users?q=${encodeURIComponent(q)}`,
  );
  return res.data ?? [];
}

function RelativeTime({ iso }: { iso: string }) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return <span>{diff}s ago</span>;
  if (diff < 3600) return <span>{Math.floor(diff / 60)}m ago</span>;
  if (diff < 86400) return <span>{Math.floor(diff / 3600)}h ago</span>;
  return <span>{Math.floor(diff / 86400)}d ago</span>;
}

function MergeDialog({
  slug,
  eventId,
  rosterId,
  onSuccess,
}: {
  slug: string;
  eventId: string;
  rosterId: string;
  onSuccess: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SchoolUser | null>(null);

  const searchQuery = useQuery({
    queryKey: ["school-users-search", slug, eventId, query],
    queryFn: () => fetchSchoolUsers(slug, eventId, query),
    enabled: query.length >= 2,
  });

  const mergeMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      await (
        client as unknown as Record<
          string,
          (p: string, opts: { body: unknown }) => Promise<void>
        >
      )["POST"](
        `/orgs/${slug}/events/${eventId}/reconciliation/rosters/${rosterId}/merge`,
        {
          body: { targetUserId },
        },
      );
    },
    onSuccess: () => {
      toastManager.add({ title: "Roster merged", type: "success" });
      onSuccess();
    },
    onError: () => {
      toastManager.add({ title: "Merge failed", type: "error" });
    },
  });

  return (
    <div className="flex flex-col gap-2 rounded border p-3">
      <Input
        placeholder="Search school by name or email..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelected(null);
        }}
      />
      {searchQuery.data && searchQuery.data.length > 0 && !selected && (
        <div className="bg-background flex flex-col gap-1 rounded border p-1 text-sm">
          {searchQuery.data.map((u) => (
            <button
              key={u.id}
              className="hover:bg-muted rounded px-2 py-1 text-left"
              onClick={() => setSelected(u)}
            >
              {u.firstName} {u.lastName} — {u.email}
            </button>
          ))}
        </div>
      )}
      {selected && (
        <div className="text-muted-foreground text-sm">
          Selected: {selected.firstName} {selected.lastName} ({selected.email})
        </div>
      )}
      <Button
        size="sm"
        disabled={!selected || mergeMutation.isPending}
        onClick={() => selected && mergeMutation.mutate(selected.id)}
      >
        Confirm merge
      </Button>
    </div>
  );
}

function ReconciliationPage() {
  const { orgSlug } = Route.useParams();
  const { data: events } = useSuspenseQuery(adminQueries.events(orgSlug));
  const active = events?.find((e) => e.isActive);

  const [mergingRosterId, setMergingRosterId] = useState<string | null>(null);

  const dataQuery = useQuery({
    queryKey: ["reconciliation", orgSlug, active?.id],
    queryFn: () => fetchReconciliation(orgSlug, active!.id),
    enabled: !!active,
  });

  const resendMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      await (client as unknown as Record<string, (p: string) => Promise<void>>)[
        "POST"
      ](
        `/orgs/${orgSlug}/events/${active?.id}/reconciliation/invites/${inviteId}/resend`,
      );
    },
    onSuccess: () => {
      toastManager.add({ title: "Invite resent", type: "success" });
      dataQuery.refetch();
    },
    onError: () => toastManager.add({ title: "Resend failed", type: "error" }),
  });

  const revokeMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      await (client as unknown as Record<string, (p: string) => Promise<void>>)[
        "DELETE"
      ](
        `/orgs/${orgSlug}/events/${active?.id}/reconciliation/invites/${inviteId}`,
      );
    },
    onSuccess: () => {
      toastManager.add({ title: "Invite revoked", type: "success" });
      dataQuery.refetch();
    },
    onError: () => toastManager.add({ title: "Revoke failed", type: "error" }),
  });

  if (!active) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
        No active event.
      </div>
    );
  }

  const invites = dataQuery.data?.invites ?? [];
  const orphans = dataQuery.data?.orphanRosters ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8 p-6">
      <div>
        <h1 className="text-lg font-semibold">Reconciliation</h1>
        <p className="text-muted-foreground text-sm">
          Manage unclaimed school invites and orphan roster rows for{" "}
          <span className="font-medium">{active.name}</span>.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold tracking-wide uppercase">
          Unclaimed invites ({invites.length})
        </h2>
        {invites.length === 0 ? (
          <p className="text-muted-foreground text-sm">No unclaimed invites.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded border px-4 py-3 text-sm"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{inv.email}</span>
                  {inv.organization && (
                    <span className="text-muted-foreground">
                      {inv.organization}
                    </span>
                  )}
                  <span className="text-muted-foreground text-xs">
                    Sent <RelativeTime iso={inv.createdAt} /> · Expires{" "}
                    {new Date(inv.expiresAt) < new Date() ? (
                      <span className="text-destructive">expired</span>
                    ) : (
                      <RelativeTime iso={inv.expiresAt} />
                    )}
                    {inv.consumedAt && (
                      <span className="text-green-600"> · Consumed</span>
                    )}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resendMutation.mutate(inv.id)}
                    disabled={resendMutation.isPending}
                  >
                    Resend
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => revokeMutation.mutate(inv.id)}
                    disabled={revokeMutation.isPending}
                  >
                    Revoke
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold tracking-wide uppercase">
          Orphan roster rows ({orphans.length})
        </h2>
        {orphans.length === 0 ? (
          <p className="text-muted-foreground text-sm">No orphan rows.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {orphans.map((row) => (
              <div
                key={row.id}
                className="flex flex-col gap-2 rounded border px-4 py-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">
                      {row.firstName} {row.lastName}
                    </span>
                    <span className="text-muted-foreground">{row.email}</span>
                    {row.organization && (
                      <span className="text-muted-foreground text-xs">
                        {row.organization}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setMergingRosterId(
                        mergingRosterId === row.id ? null : row.id,
                      )
                    }
                  >
                    {mergingRosterId === row.id ? "Cancel" : "Merge"}
                  </Button>
                </div>
                {mergingRosterId === row.id && (
                  <MergeDialog
                    slug={orgSlug}
                    eventId={active.id}
                    rosterId={row.id}
                    onSuccess={() => {
                      setMergingRosterId(null);
                      dataQuery.refetch();
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
