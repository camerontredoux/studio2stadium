import {
  CheckIcon,
  EnvelopeSimpleIcon,
  SealCheckIcon,
  UserCircleDashedIcon,
} from "@phosphor-icons/react";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/event/button";
import { Icon } from "@/components/event/icon";
import { Panel, PanelToolbar } from "@/components/event/panel";
import { Search } from "@/components/event/search";
import { Segmented, type SegmentedOption } from "@/components/event/segmented";
import { Tag } from "@/components/event/tag";
import { useDebouncedCallback } from "@/components/hooks/use-debounced-callback";
import { toastManager } from "@/components/ui/toast-manager";
import { cn } from "@/components/utils/cn";
import {
  RECONCILIATION_KEY_PREFIX,
  reconciliationQueries,
  type OrphanRoster,
  type ReconciliationInvite,
} from "@/features/org/api/reconciliation-queries";
import { useAdminEvent } from "@/features/org/context/use-admin-event";
import { ConfirmDialog } from "@/features/org/live/shared/confirm-dialog";
import { SubpageHeader } from "@/features/org/live/shared/event-header";
import { ShellPage } from "@/features/org/live/shared/shell-slots";
import { useVirtualRows } from "@/features/org/live/shared/use-virtual-rows";
import { type ApiSchemas, client } from "@/lib/api/client";

import { relativeTime } from "./age";

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

/** The server's view behind each tab. */
type View = "unclaimed" | "claimed" | "orphans";

const PAGE_SIZE = 50;

/**
 * /admin/reconciliation: school invites nobody has claimed (resend or revoke),
 * the ones already claimed, and roster rows with no account (merge into a
 * school user). Each tab pages on the server and renders only nearby rows.
 */
export function ReconciliationPage({ orgSlug }: { orgSlug: string }) {
  const { selectedEvent: event } = useAdminEvent();
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>("unclaimed");
  const [merging, setMerging] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const commitSearch = useDebouncedCallback((value: string) => {
    setSearch(value.trim());
    setMerging(null);
  }, 300);
  const [revoking, setRevoking] = useState<ReconciliationInvite | null>(null);
  const eventId = event?.id ?? "";
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: RECONCILIATION_KEY_PREFIX });

  const countsQuery = useQuery({
    ...reconciliationQueries.counts(orgSlug, eventId),
    enabled: !!event,
  });
  const q = search || undefined;
  const invitesQuery = useInfiniteQuery({
    ...reconciliationQueries.invitePages(
      orgSlug,
      eventId,
      { claimed: view === "claimed", search: q },
      PAGE_SIZE,
    ),
    enabled: !!event && view !== "orphans",
    placeholderData: keepPreviousData,
  });
  const orphansQuery = useInfiniteQuery({
    ...reconciliationQueries.orphanPages(
      orgSlug,
      eventId,
      { search: q },
      PAGE_SIZE,
    ),
    enabled: !!event && view === "orphans",
    placeholderData: keepPreviousData,
  });
  const list = view === "orphans" ? orphansQuery : invitesQuery;
  const pages = list.data?.pages;
  const rows = useMemo(
    () =>
      (
        pages as { data: (ReconciliationInvite | OrphanRoster)[] }[] | undefined
      )?.flatMap((page) => page.data) ?? [],
    [pages],
  );
  const { fetchNextPage } = list;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [listEl, setListEl] = useState<HTMLUListElement | null>(null);
  const virtual = useVirtualRows({
    count: rows.length,
    scrollRef,
    list: listEl,
    estimate: 57,
    hasMore: list.hasNextPage && !list.isFetchNextPageError,
    loadingMore: list.isFetchingNextPage,
    onLoadMore: () => void fetchNextPage(),
    // A new tab, search or filter starts again from the top.
    resetKey: [view, search],
  });

  const resend = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await client.POST(
        "/orgs/{slug}/events/{id}/reconciliation/invites/{inviteId}/resend",
        { params: { path: { slug: orgSlug, id: eventId, inviteId } } },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toastManager.add({ title: "Invite resent", type: "success" });
      void refresh();
    },
    onError: () => toastManager.add({ title: "Resend failed", type: "error" }),
  });

  const revoke = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await client.DELETE(
        "/orgs/{slug}/events/{id}/reconciliation/invites/{inviteId}",
        { params: { path: { slug: orgSlug, id: eventId, inviteId } } },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toastManager.add({ title: "Invite revoked", type: "success" });
      setRevoking(null);
      void refresh();
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

  const counts = countsQuery.data;
  const options: SegmentedOption<View>[] = [
    {
      value: "unclaimed",
      label: "Unclaimed",
      icon: EnvelopeSimpleIcon,
      count: counts?.unclaimed,
    },
    {
      value: "claimed",
      label: "Claimed",
      icon: SealCheckIcon,
      count: counts?.claimed,
    },
    {
      value: "orphans",
      label: "Orphan rows",
      icon: UserCircleDashedIcon,
      count: counts?.orphans,
    },
  ];

  const now = new Date();
  const renderRow = (row: ReconciliationInvite | OrphanRoster) => {
    if (view === "orphans") {
      const orphan = row as OrphanRoster;
      return (
        <>
          <div className="flex min-h-12 flex-wrap items-center gap-x-(--space-10) gap-y-(--space-6) px-(--space-14) py-(--space-8)">
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-fg truncate text-[13px] leading-[1.4] font-medium">
                {orphan.firstName} {orphan.lastName}
              </span>
              <span className="text-fg-3 truncate font-mono text-[11.5px] leading-[1.4]">
                {orphan.email}
                {orphan.organization && ` · ${orphan.organization}`}
              </span>
            </span>
            <Button
              size="sm"
              aria-expanded={merging === orphan.id}
              onClick={() =>
                setMerging(merging === orphan.id ? null : orphan.id)
              }
            >
              {merging === orphan.id ? "Cancel" : "Merge"}
            </Button>
          </div>
          {merging === orphan.id && (
            <MergeForm
              slug={orgSlug}
              eventId={event.id}
              rosterId={orphan.id}
              onMerged={() => {
                setMerging(null);
                void refresh();
              }}
            />
          )}
        </>
      );
    }
    const invite = row as ReconciliationInvite;
    if (invite.consumedAt) {
      return (
        <RowBody>
          <InviteText
            email={invite.email}
            meta={[
              invite.organization,
              `Sent ${relativeTime(invite.createdAt)}`,
              `Claimed ${relativeTime(invite.consumedAt)}`,
            ]}
            tag={<Tag tone="muted">Claimed</Tag>}
          />
        </RowBody>
      );
    }
    const expired = new Date(invite.expiresAt) < now;
    return (
      <RowBody>
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
          <Button size="sm" variant="ghost" onClick={() => setRevoking(invite)}>
            Revoke
          </Button>
          <Button
            size="sm"
            disabled={resend.isPending && resend.variables === invite.id}
            // Resending also pushes the expiry out, so it revives an expired link.
            title={expired ? "Resend the email and extend the link" : undefined}
            onClick={() => resend.mutate(invite.id)}
          >
            Resend
          </Button>
        </span>
      </RowBody>
    );
  };

  const emptyText = search
    ? "Nothing matches."
    : view === "unclaimed"
      ? "No unclaimed invites."
      : view === "claimed"
        ? "No claimed invites."
        : "No orphan rows.";

  return (
    <ShellPage header={header}>
      <Panel
        aria-label="Reconciliation"
        className="desk:max-h-[calc(100vh-64px)]"
      >
        <PanelToolbar>
          <Segmented
            label="Show"
            value={view}
            onChange={(next) => {
              setView(next);
              setMerging(null);
            }}
            options={options}
          />
          <Search
            placeholder="Search"
            aria-label={
              view === "orphans"
                ? "Search orphan rows by name, email or school"
                : "Search invites by email or school"
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              commitSearch(e.target.value);
            }}
          />
        </PanelToolbar>
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
          {list.isPending ? (
            <Empty>Loading…</Empty>
          ) : list.isError && !list.isFetchNextPageError ? (
            <Empty>Couldn’t load this list.</Empty>
          ) : rows.length === 0 ? (
            <Empty>{emptyText}</Empty>
          ) : (
            <ul
              ref={setListEl}
              className="m-0 list-none p-0"
              style={{
                paddingTop: virtual.padTop,
                paddingBottom: virtual.padBottom,
              }}
            >
              {virtual.items.map((item) => {
                const row = rows[item.index]!;
                return (
                  <li
                    key={row.id}
                    ref={virtual.measure}
                    data-index={item.index}
                    className={cn(
                      "border-line border-b",
                      virtual.isLast(item.index) && "border-b-0",
                    )}
                  >
                    {renderRow(row)}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
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

function RowBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-12 items-center gap-(--space-10) px-(--space-14) py-(--space-8)">
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="type-body text-fg-3 m-0 px-(--space-14) py-(--space-16)">
      {children}
    </p>
  );
}
