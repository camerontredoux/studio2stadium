import { CheckIcon } from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/event/button";
import { Icon } from "@/components/event/icon";
import { Panel, PanelHead } from "@/components/event/panel";
import { Search } from "@/components/event/search";
import { Tag } from "@/components/event/tag";
import { toastManager } from "@/components/ui/toast-manager";
import { cn } from "@/components/utils/cn";
import { useAdminEvent } from "@/features/org/context/use-admin-event";
import { ConfirmDialog } from "@/features/org/live/shared/confirm-dialog";
import { SubpageHeader } from "@/features/org/live/shared/event-header";
import { ShellPage } from "@/features/org/live/shared/shell-slots";
import { $api, type ApiSchemas, client } from "@/lib/api/client";

import { relativeTime } from "./age";

type Invite =
  ApiSchemas["OrgsIdEventsIdReconciliationResponse"]["invites"][number];
type SchoolUser =
  ApiSchemas["OrgsIdEventsIdReconciliationSchoolusersResponse"][number];

// The spec types this route's query as `never`, so `q` goes in the path by hand.
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

/**
 * /admin/reconciliation: school invites nobody has claimed (resend or revoke)
 * and roster rows with no account (merge into a school user).
 */
export function ReconciliationPage({ orgSlug }: { orgSlug: string }) {
  const { selectedEvent: event } = useAdminEvent();
  const [merging, setMerging] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<Invite | null>(null);

  const data = useQuery(
    $api.queryOptions(
      "get",
      "/orgs/{slug}/events/{id}/reconciliation",
      { params: { path: { slug: orgSlug, id: event?.id ?? "" } } },
      { enabled: !!event },
    ),
  );

  const resend = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await client.POST(
        "/orgs/{slug}/events/{id}/reconciliation/invites/{inviteId}/resend",
        { params: { path: { slug: orgSlug, id: event!.id, inviteId } } },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toastManager.add({ title: "Invite resent", type: "success" });
      void data.refetch();
    },
    onError: () => toastManager.add({ title: "Resend failed", type: "error" }),
  });

  const revoke = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await client.DELETE(
        "/orgs/{slug}/events/{id}/reconciliation/invites/{inviteId}",
        { params: { path: { slug: orgSlug, id: event!.id, inviteId } } },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toastManager.add({ title: "Invite revoked", type: "success" });
      setRevoking(null);
      void data.refetch();
    },
    onError: () => toastManager.add({ title: "Revoke failed", type: "error" }),
  });

  const header = (
    <SubpageHeader
      event={event ?? null}
      title="Reconciliation"
      dashboardTo="/o/$orgSlug/admin"
      showStatus
    />
  );

  if (!event) {
    return (
      <ShellPage header={header}>
        <Panel>
          <Empty>No event selected.</Empty>
        </Panel>
      </ShellPage>
    );
  }

  const allInvites = data.data?.invites ?? [];
  // The API lists every invite. Claimed ones need no action (the backend
  // refuses to resend them), so they sit in their own read-only list.
  const invites = allInvites.filter((invite) => !invite.consumedAt);
  const claimed = allInvites.filter((invite) => invite.consumedAt);
  const orphans = data.data?.orphanRosters ?? [];
  const loading = data.isPending;

  return (
    <ShellPage header={header}>
      <Panel aria-label="Unclaimed invites">
        <PanelHead
          label="Unclaimed invites"
          count={loading ? undefined : invites.length}
        />
        {loading ? (
          <Empty>Loading…</Empty>
        ) : invites.length === 0 ? (
          <Empty>No unclaimed invites.</Empty>
        ) : (
          <ul className="m-0 list-none p-0">
            {invites.map((invite) => {
              const expired = new Date(invite.expiresAt) < new Date();
              return (
                <Row key={invite.id}>
                  <InviteText
                    email={invite.email}
                    meta={[
                      invite.organization,
                      `Sent ${relativeTime(invite.createdAt)}`,
                      `${expired ? "Expired" : "Expires"} ${relativeTime(invite.expiresAt)}`,
                    ]}
                    tag={expired && <Tag tone="danger">Expired</Tag>}
                  />
                  <span className="flex shrink-0 items-center gap-(--space-4)">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setRevoking(invite)}
                    >
                      Revoke
                    </Button>
                    <Button
                      size="sm"
                      disabled={
                        resend.isPending && resend.variables === invite.id
                      }
                      // Resending also pushes the expiry out, so it revives an expired link.
                      title={
                        expired
                          ? "Resend the email and extend the link"
                          : undefined
                      }
                      onClick={() => resend.mutate(invite.id)}
                    >
                      Resend
                    </Button>
                  </span>
                </Row>
              );
            })}
          </ul>
        )}
      </Panel>

      {claimed.length > 0 && (
        <Panel aria-label="Claimed invites">
          <PanelHead label="Claimed invites" count={claimed.length} />
          <ul className="m-0 list-none p-0">
            {claimed.map((invite) => (
              <Row key={invite.id}>
                <InviteText
                  email={invite.email}
                  meta={[
                    invite.organization,
                    `Sent ${relativeTime(invite.createdAt)}`,
                    `Claimed ${relativeTime(invite.consumedAt!)}`,
                  ]}
                  tag={<Tag tone="muted">Claimed</Tag>}
                />
              </Row>
            ))}
          </ul>
        </Panel>
      )}

      <Panel aria-label="Orphan roster rows">
        <PanelHead
          label="Orphan roster rows"
          count={loading ? undefined : orphans.length}
        />
        {loading ? (
          <Empty>Loading…</Empty>
        ) : orphans.length === 0 ? (
          <Empty>No orphan rows.</Empty>
        ) : (
          <ul className="m-0 list-none p-0">
            {orphans.map((row) => (
              <li key={row.id} className="border-line border-b last:border-b-0">
                <div className="flex min-h-12 flex-wrap items-center gap-x-(--space-10) gap-y-(--space-6) px-(--space-14) py-(--space-8)">
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-fg truncate text-[13px] leading-[1.4] font-medium">
                      {row.firstName} {row.lastName}
                    </span>
                    <span className="text-fg-3 truncate font-mono text-[11.5px] leading-[1.4]">
                      {row.email}
                      {row.organization && ` · ${row.organization}`}
                    </span>
                  </span>
                  <Button
                    size="sm"
                    aria-expanded={merging === row.id}
                    onClick={() =>
                      setMerging(merging === row.id ? null : row.id)
                    }
                  >
                    {merging === row.id ? "Cancel" : "Merge"}
                  </Button>
                </div>
                {merging === row.id && (
                  <MergeForm
                    slug={orgSlug}
                    eventId={event.id}
                    rosterId={row.id}
                    onMerged={() => {
                      setMerging(null);
                      void data.refetch();
                    }}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <ConfirmDialog
        open={revoking !== null}
        onOpenChange={(open) => {
          if (!open) setRevoking(null);
        }}
        title="Revoke this invite?"
        description={`The link sent to ${revoking?.email ?? ""} stops working.`}
        confirmLabel="Revoke"
        pending={revoke.isPending}
        onConfirm={() => {
          if (revoking) revoke.mutate(revoking.id);
        }}
      />
    </ShellPage>
  );
}

/** Search school users (2+ characters), pick one, then "Confirm merge". */
function MergeForm({
  slug,
  eventId,
  rosterId,
  onMerged,
}: {
  slug: string;
  eventId: string;
  rosterId: string;
  onMerged: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SchoolUser | null>(null);

  const results = useQuery({
    queryKey: ["school-users-search", slug, eventId, query],
    queryFn: () => fetchSchoolUsers(slug, eventId, query),
    enabled: query.trim().length >= 2,
  });

  const merge = useMutation({
    mutationFn: async (targetUserId: string) => {
      const { error } = await client.POST(
        "/orgs/{slug}/events/{id}/reconciliation/rosters/{rosterId}/merge",
        {
          params: { path: { slug, id: eventId, rosterId } },
          body: { targetUserId },
        },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toastManager.add({ title: "Roster merged", type: "success" });
      onMerged();
    },
    onError: () => toastManager.add({ title: "Merge failed", type: "error" }),
  });

  const users = results.data ?? [];

  return (
    <div className="bg-surface-head border-line flex flex-col gap-(--space-8) border-t px-(--space-14) py-(--space-10)">
      <Search
        placeholder="Search"
        aria-label="Search school by name or email"
        autoFocus
        className="ms-0 flex-auto"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelected(null);
        }}
      />
      {query.trim().length >= 2 && (
        <ul
          aria-label="School users"
          className="border-line bg-surface m-0 flex max-h-56 list-none flex-col overflow-y-auto rounded-(--radius-6) border p-(--space-4)"
        >
          {results.isPending ? (
            <li className="type-body text-fg-3 px-(--space-8) py-(--space-6)">
              Searching…
            </li>
          ) : users.length === 0 ? (
            <li className="type-body text-fg-3 px-(--space-8) py-(--space-6)">
              No school users match.
            </li>
          ) : (
            users.map((user) => {
              const isSelected = selected?.id === user.id;
              return (
                <li key={user.id}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelected(user)}
                    className={cn(
                      "text-fg hover:bg-surface-active s2s-focus flex w-full cursor-pointer items-center gap-(--space-8) rounded-(--radius-4) border-0 bg-transparent px-(--space-8) py-(--space-6) text-left text-[13px]",
                      isSelected && "bg-surface-pressed",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {user.firstName} {user.lastName}
                      <span className="text-fg-3 font-mono text-[11.5px]">
                        {" "}
                        {user.email}
                      </span>
                    </span>
                    {isSelected && <Icon icon={CheckIcon} />}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="primary"
          disabled={!selected || merge.isPending}
          onClick={() => selected && merge.mutate(selected.id)}
        >
          {merge.isPending ? "Merging…" : "Confirm merge"}
        </Button>
      </div>
    </div>
  );
}

/**
 * An invite's email and its details. The details wrap a part at a time instead
 * of truncating, so phones still show when it expires.
 */
function InviteText({
  email,
  meta,
  tag,
}: {
  email: string;
  meta: (string | null | undefined)[];
  tag?: React.ReactNode;
}) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="flex min-w-0 items-center gap-(--space-6)">
        <span className="text-fg min-w-0 font-mono text-[12.5px] leading-[1.4] break-all">
          {email}
        </span>
        {tag}
      </span>
      <span className="text-fg-3 flex flex-wrap gap-x-(--space-4) text-[12px] leading-[1.4]">
        {meta
          .filter((part): part is string => !!part)
          .map((part, i) => (
            <span key={part} className="whitespace-nowrap">
              {i > 0 && "· "}
              {part}
            </span>
          ))}
      </span>
    </span>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <li className="border-line flex min-h-12 items-center gap-(--space-10) border-b px-(--space-14) py-(--space-8) last:border-b-0">
      {children}
    </li>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="type-body text-fg-3 m-0 px-(--space-14) py-(--space-16)">
      {children}
    </p>
  );
}
