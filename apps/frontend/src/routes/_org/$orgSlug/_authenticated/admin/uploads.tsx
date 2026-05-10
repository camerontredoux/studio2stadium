import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetHeader,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/components/utils/cn";
import { adminQueries } from "@/features/org/api/admin-queries";
import {
  auditQueries,
  type AuditAction,
  type AuditLogChildEntry,
  type AuditLogEntry,
  type AuditLogStats,
  type AuditResource,
} from "@/features/org/api/audit-queries";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format, formatDistanceToNow } from "date-fns";
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronRightIcon as ExpandIcon,
  FilterIcon,
  Loader2Icon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/admin/uploads",
)({
  component: AuditLogPage,
});

const ACTION_LABELS: Record<AuditAction, string> = {
  upload: "Upload",
  create: "Create",
  update: "Update",
  delete: "Delete",
  activate: "Activate",
  resend_invite: "Resend invite",
};

const RESOURCE_LABELS: Record<string, string> = {
  roster: "Roster",
  event: "Event",
  checklist: "Checklist",
  csv_upload: "CSV Upload",
  invite: "Invite",
  video_category: "Video Category",
  video: "Video",
};

const ACTION_COLORS: Record<AuditAction, { text: string; dot: string }> = {
  upload: { text: "text-blue-600", dot: "bg-blue-500" },
  create: { text: "text-success-foreground", dot: "bg-success" },
  update: { text: "text-amber-600", dot: "bg-amber-500" },
  delete: { text: "text-destructive", dot: "bg-destructive" },
  activate: { text: "text-purple-600", dot: "bg-purple-500" },
  resend_invite: { text: "text-cyan-600", dot: "bg-cyan-500" },
};

const PAGE_SIZE_OPTIONS = [
  { label: "20", value: "20" },
  { label: "50", value: "50" },
  { label: "100", value: "100" },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function generateSummary(entry: AuditLogEntry | AuditLogChildEntry): string {
  const meta = entry.metadata ?? {};
  switch (entry.action) {
    case "upload": {
      const added = (meta.rowsAdded as number) ?? 0;
      const updated = (meta.rowsUpdated as number) ?? 0;
      const errored = (meta.rowsErrored as number) ?? 0;
      const rowsActivated = meta.rowsActivated as number | undefined;
      const rowsPending = meta.rowsPending as number | undefined;
      const type = (meta.type as string) ?? entry.resource;
      const parts = [`Uploaded ${added} ${type}`];
      if (updated > 0) parts.push(`${updated} updated`);
      if (errored > 0) parts.push(`${errored} errors`);
      if (rowsActivated !== undefined && rowsPending !== undefined) {
        parts.push(`${rowsActivated} activated · ${rowsPending} pending`);
      }
      return parts.join(", ");
    }
    case "create":
      return `Created ${(RESOURCE_LABELS[entry.resource] ?? entry.resource).toLowerCase()}`;
    case "update": {
      const diff = meta.diff as
        | Record<string, { from: unknown; to: unknown }>
        | undefined;
      if (diff) {
        const fields = Object.keys(diff);
        if (fields.length === 1) {
          const f = fields[0];
          const d = diff[f];
          return `Updated ${f}: ${String(d?.from ?? "")} → ${String(d?.to ?? "")}`;
        }
        return `Updated ${fields.join(", ")}`;
      }
      return `Updated ${(RESOURCE_LABELS[entry.resource] ?? entry.resource).toLowerCase()}`;
    }
    case "delete": {
      const count = (meta.count as number) ?? 1;
      return `Deleted ${count} ${(RESOURCE_LABELS[entry.resource] ?? entry.resource).toLowerCase()}${count !== 1 ? "s" : ""}`;
    }
    case "activate":
      return "Activated event";
    case "resend_invite": {
      const sent = (meta.sent as number) ?? 0;
      return `Resent ${sent} invite${sent !== 1 ? "s" : ""}`;
    }
    default:
      return entry.action;
  }
}

function isComplexEntry(entry: AuditLogEntry): boolean {
  return (entry.childCount ?? 0) > 0;
}

// ── Action Badge ─────────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: AuditAction }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] tracking-wide uppercase tabular-nums 2xl:text-xs",
        ACTION_COLORS[action].text,
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", ACTION_COLORS[action].dot)}
        aria-hidden
      />
      {ACTION_LABELS[action]}
    </span>
  );
}

// ── Diff View ────────────────────────────────────────────────────────────────

function DiffView({ metadata }: { metadata: Record<string, unknown> | null }) {
  if (!metadata)
    return (
      <span className="text-muted-foreground text-xs">
        No details recorded.
      </span>
    );

  const diff = metadata.diff as
    | Record<string, { from: unknown; to: unknown }>
    | undefined;
  const before = metadata.before as Record<string, unknown> | undefined;
  const after = metadata.after as Record<string, unknown> | undefined;
  const counts = metadata.counts as Record<string, number> | undefined;

  if (counts) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(counts).map(([k, v]) => (
          <div key={k} className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
              {k}
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {String(v)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (diff && Object.keys(diff).length > 0) {
    return (
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-border border-b">
            <th className="text-muted-foreground py-1 pr-3 text-left text-[10px] font-semibold tracking-widest uppercase">
              Field
            </th>
            <th className="text-muted-foreground py-1 pr-3 text-left text-[10px] font-semibold tracking-widest uppercase">
              Before
            </th>
            <th className="text-muted-foreground py-1 text-left text-[10px] font-semibold tracking-widest uppercase">
              After
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(diff).map(([field, { from, to }]) => (
            <tr key={field} className="border-border border-b last:border-b-0">
              <td className="py-1 pr-3 font-medium">{field}</td>
              <td className="text-destructive py-1 pr-3 font-mono">
                {String(from ?? "—")}
              </td>
              <td className="text-success-foreground py-1 font-mono">
                {String(to ?? "—")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (after) {
    return (
      <div className="font-mono text-xs">
        {Object.entries(after)
          .filter(([, v]) => v !== null && v !== undefined && v !== "")
          .map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="text-muted-foreground w-32 shrink-0">{k}:</span>
              <span>{String(v)}</span>
            </div>
          ))}
      </div>
    );
  }

  if (before) {
    return (
      <div className="font-mono text-xs">
        {Object.entries(before)
          .filter(([, v]) => v !== null && v !== undefined && v !== "")
          .map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="text-muted-foreground w-32 shrink-0">{k}:</span>
              <span className="text-destructive line-through">{String(v)}</span>
            </div>
          ))}
      </div>
    );
  }

  return (
    <span className="text-muted-foreground text-xs italic">
      No diff available.
    </span>
  );
}

// ── Children Sheet ──────────────────────────────────────────────────────────

function ChildrenSheet({
  entry,
  orgSlug,
  eventId,
  open,
  onOpenChange,
}: {
  entry: AuditLogEntry | null;
  orgSlug: string;
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const childrenQuery = useQuery({
    ...auditQueries.children(orgSlug, eventId, entry?.id ?? ""),
    enabled: open && !!entry?.id,
  });

  const children = (childrenQuery.data?.data ?? []) as AuditLogChildEntry[];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPopup className="w-full sm:max-w-xl">
        <SheetHeader className="border-border border-b px-4 pt-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {entry && <ActionBadge action={entry.action} />}
              <SheetTitle className="text-sm font-semibold">
                {entry ? generateSummary(entry) : "Detail"}
              </SheetTitle>
            </div>
            <SheetClose
              render={
                <Button variant="ghost" size="icon-xs" className="size-6" />
              }
            >
              <XIcon className="size-3.5" />
            </SheetClose>
          </div>
          {entry && (
            <div className="text-muted-foreground mt-1 text-xs">
              {entry.actor.firstName} {entry.actor.lastName} ·{" "}
              {format(new Date(entry.createdAt), "MMM d, yyyy 'at' h:mm a")}
            </div>
          )}
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
          {entry && (
            <div className="mb-4">
              <span className="text-muted-foreground mb-2 block text-[10px] font-semibold tracking-widest uppercase">
                Summary
              </span>
              <DiffView metadata={entry.metadata} />
            </div>
          )}

          {(entry?.childCount ?? 0) > 0 && (
            <>
              <div className="border-border mb-3 border-t pt-3">
                <span className="text-muted-foreground mb-2 block text-[10px] font-semibold tracking-widest uppercase">
                  Child entries ({entry?.childCount})
                </span>
              </div>
              {childrenQuery.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-muted/40 h-8 animate-pulse rounded"
                    />
                  ))}
                </div>
              ) : (
                <div className="divide-border divide-y">
                  {children.map((child) => (
                    <div key={child.id} className="py-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <ActionBadge action={child.action} />
                            <span className="text-muted-foreground text-[10px]">
                              {RESOURCE_LABELS[child.resource] ?? child.resource}
                            </span>
                          </div>
                          <span className="text-xs">
                            {generateSummary(child)}
                          </span>
                        </div>
                        <span className="text-muted-foreground shrink-0 text-[10px] tabular-nums">
                          {formatDistanceToNow(new Date(child.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      {child.metadata && (
                        <div className="mt-2 pl-2">
                          <DiffView metadata={child.metadata} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </SheetPopup>
    </Sheet>
  );
}

// ── Expanded Row ─────────────────────────────────────────────────────────────

function ExpandedRow({
  entry,
  colSpan,
}: {
  entry: AuditLogEntry;
  colSpan: number;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="border-border bg-muted/20 border-b px-4 py-3"
      >
        <DiffView metadata={entry.metadata} />
      </td>
    </tr>
  );
}

// ── Right Sidebar ─────────────────────────────────────────────────────────────

function AuditSidebar({
  stats,
  isLoadingStats,
}: {
  stats: AuditLogStats | undefined;
  isLoadingStats: boolean;
}) {
  const totalActions = stats?.activity.thisMonth ?? 0;
  const maxBreakdownCount = Math.max(
    ...(stats?.actionBreakdown.map((a) => a.count) ?? [1]),
    1,
  );

  return (
    <aside className="border-border hidden shrink-0 flex-col border-t xl:flex xl:w-[320px] xl:overflow-x-hidden xl:overflow-y-auto xl:border-t-0 xl:border-l">
      {/* Activity summary — matches dashboard StatCell pattern */}
      <section
        aria-label="Activity stats"
        className="border-border flex items-stretch border-b"
      >
        {isLoadingStats ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="border-border flex flex-1 flex-col justify-center gap-1 border-l px-4 py-3 first:border-l-0"
              >
                <div className="bg-muted/40 h-7 w-10 animate-pulse rounded" />
                <div className="bg-muted/40 h-3 w-12 animate-pulse rounded" />
              </div>
            ))}
          </>
        ) : (
          <>
            {[
              { label: "Today", value: stats?.activity.today ?? 0 },
              { label: "Week", value: stats?.activity.thisWeek ?? 0 },
              { label: "Month", value: stats?.activity.thisMonth ?? 0 },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="border-border flex flex-1 flex-col justify-center gap-1 border-l px-4 py-3 first:border-l-0"
              >
                <span className="text-2xl leading-none font-semibold tracking-tight tabular-nums 2xl:text-3xl">
                  {value.toLocaleString()}
                </span>
                <span className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase 2xl:text-xs">
                  {label}
                </span>
              </div>
            ))}
          </>
        )}
      </section>

      {/* Recent errors */}
      <section className="border-border border-b">
        <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
          <span className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase 2xl:text-xs">
            Recent errors
          </span>
          <span className="text-muted-foreground text-[10px] tracking-widest uppercase 2xl:text-xs">
            7d
          </span>
        </div>
        <div className="px-4 pb-3">
          {isLoadingStats ? (
            <div className="bg-muted/40 h-6 animate-pulse rounded" />
          ) : (
            <span
              className={cn(
                "text-2xl font-semibold tabular-nums 2xl:text-3xl",
                (stats?.recentErrors ?? 0) > 0
                  ? "text-destructive"
                  : "text-foreground",
              )}
            >
              {stats?.recentErrors ?? 0}
            </span>
          )}
        </div>
      </section>

      {/* Upload health */}
      <section className="border-border border-b">
        <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
          <span className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase 2xl:text-xs">
            Upload health
          </span>
        </div>
        <div className="px-4 pb-3">
          {isLoadingStats ? (
            <div className="space-y-2">
              <div className="bg-muted/40 h-4 animate-pulse rounded" />
              <div className="bg-muted/40 h-1.5 animate-pulse rounded-full" />
            </div>
          ) : stats?.uploadHealth.total === 0 ? (
            <span className="text-muted-foreground text-xs">
              No uploads yet
            </span>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">
                  {stats?.uploadHealth.total} upload
                  {(stats?.uploadHealth.total ?? 0) !== 1 ? "s" : ""}
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {stats?.uploadHealth.successRate ?? 100}%
                </span>
              </div>
              <div className="bg-border relative h-1.5 overflow-hidden rounded-full">
                <div
                  className={cn(
                    "h-full rounded-full",
                    (stats?.uploadHealth.successRate ?? 100) >= 90
                      ? "bg-success"
                      : (stats?.uploadHealth.successRate ?? 100) >= 70
                        ? "bg-warning"
                        : "bg-destructive",
                  )}
                  style={{
                    width: `${stats?.uploadHealth.successRate ?? 100}%`,
                  }}
                />
              </div>
              <span className="text-muted-foreground text-[10px]">
                {(stats?.uploadHealth.totalRows ?? 0).toLocaleString()} rows ·{" "}
                {(stats?.uploadHealth.erroredRows ?? 0).toLocaleString()}{" "}
                errored
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Top actors */}
      {(stats?.topActors.length ?? 0) > 0 && (
        <section className="border-border border-b">
          <div className="px-4 pt-3 pb-2">
            <span className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase 2xl:text-xs">
              Top actors
            </span>
          </div>
          <div className="px-4 pb-3">
            {isLoadingStats ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-muted/40 h-6 animate-pulse rounded"
                  />
                ))}
              </div>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {stats?.topActors.map((actor, i) => (
                  <li
                    key={actor.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-muted-foreground w-4 shrink-0 text-right text-[10px] tabular-nums">
                        {i + 1}.
                      </span>
                      <span className="min-w-0 truncate text-xs font-medium">
                        {actor.name}
                      </span>
                    </div>
                    <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
                      {actor.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* Action breakdown */}
      {(stats?.actionBreakdown.length ?? 0) > 0 && (
        <section className="border-border border-b last:border-b-0">
          <div className="px-4 pt-3 pb-2">
            <span className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase 2xl:text-xs">
              Action breakdown
            </span>
          </div>
          <div className="px-4 pb-3">
            {isLoadingStats ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-muted/40 h-5 animate-pulse rounded"
                  />
                ))}
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {stats?.actionBreakdown.map(({ action, count }) => {
                  const pct = Math.round((count / maxBreakdownCount) * 100);
                  return (
                    <li key={action}>
                      <div className="mb-0.5 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-medium tracking-wider uppercase">
                          {ACTION_LABELS[action]}
                        </span>
                        <span className="text-muted-foreground text-[10px] tabular-nums">
                          {count}
                        </span>
                      </div>
                      <div className="bg-border relative h-1 overflow-hidden rounded-full">
                        <div
                          className={cn("h-full", ACTION_COLORS[action].dot)}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* Empty stats */}
      {!isLoadingStats &&
        totalActions === 0 &&
        (stats?.actionBreakdown.length ?? 0) === 0 && (
          <div className="px-4 py-6 text-center">
            <span className="text-muted-foreground text-xs">
              No activity recorded yet.
            </span>
          </div>
        )}
    </aside>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

function AuditLogPage() {
  const { orgSlug } = Route.useParams();
  const { data: events } = useSuspenseQuery(adminQueries.events(orgSlug));

  const active = events?.find((e) => e.isActive);
  const selectedEventId = active?.id ?? "";

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<AuditAction | "all">("all");
  const [resourceFilter, setResourceFilter] = useState<AuditResource | "all">(
    "all",
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [sheetEntry, setSheetEntry] = useState<AuditLogEntry | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { state: sidebarState, isMobile } = useSidebar();

  const listQuery = useQuery({
    ...auditQueries.list(orgSlug, selectedEventId, {
      page,
      limit,
      search: search || undefined,
      action: actionFilter === "all" ? undefined : actionFilter,
      resource: resourceFilter === "all" ? undefined : resourceFilter,
      from: dateRange?.from ? dateRange.from.toISOString() : undefined,
      to: dateRange?.to ? dateRange.to.toISOString() : undefined,
      sortDir: "desc",
    }),
    enabled: !!selectedEventId,
  });

  const statsQuery = useQuery({
    ...auditQueries.stats(orgSlug, selectedEventId),
    enabled: !!selectedEventId,
  });

  const data = (listQuery.data?.data ?? []) as AuditLogEntry[];
  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);
  const start = total === 0 ? 0 : page * limit + 1;
  const end = Math.min((page + 1) * limit, total);

  const hasActiveFilters =
    actionFilter !== "all" || resourceFilter !== "all" || !!dateRange?.from;

  const columns = [
    { id: "timestamp", label: "Timestamp" },
    { id: "actor", label: "Actor" },
    { id: "action", label: "Action" },
    { id: "resource", label: "Resource" },
    { id: "summary", label: "Summary" },
  ];
  const tableColumnCount = columns.length + 1;

  const handleRowClick = (entry: AuditLogEntry) => {
    if (isComplexEntry(entry)) {
      setSheetEntry(entry);
      setSheetOpen(true);
      setExpandedRowId(null);
    } else {
      setExpandedRowId((prev) => (prev === entry.id ? null : entry.id));
      setSheetOpen(false);
    }
  };

  if (!active && events.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
        No events yet.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden xl:flex-row">
      {/* ── Main content ── */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Page header — matches dashboard EventHeader */}
        <header className="border-border flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b px-4 py-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-lg font-semibold tracking-tight 2xl:text-xl">
              Audit Log
            </h1>
            <span className="text-muted-foreground text-xs tabular-nums 2xl:text-sm">
              {active?.name ?? ""}
            </span>
          </div>
        </header>

        {/* Toolbar */}
        <div className="border-border bg-muted/40 flex shrink-0 items-center gap-1.5 border-b px-3 py-1.5">
          {/* Search */}
          <div className="relative min-w-0 flex-1 sm:max-w-56">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search by actor name..."
              className="bg-background border-border focus:border-ring h-7 w-full rounded-md border pr-2 pl-7 text-xs transition-colors outline-none 2xl:text-sm"
            />
          </div>

          {/* Action filter */}
          <Select
            items={[
              { label: "All actions", value: "all" },
              ...Object.entries(ACTION_LABELS).map(([v, l]) => ({
                label: l,
                value: v,
              })),
            ]}
            value={actionFilter}
            onValueChange={(v) => {
              if (v) {
                setActionFilter(v as AuditAction | "all");
                setPage(0);
              }
            }}
          >
            <SelectTrigger
              size="sm"
              className="hidden h-7 w-auto min-w-28 gap-1 rounded-md text-xs lg:flex"
            >
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="all">All actions</SelectItem>
              {Object.entries(ACTION_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>

          {/* Resource filter */}
          <Select
            items={[
              { label: "All resources", value: "all" },
              ...Object.entries(RESOURCE_LABELS).map(([v, l]) => ({
                label: l,
                value: v,
              })),
            ]}
            value={resourceFilter}
            onValueChange={(v) => {
              if (v) {
                setResourceFilter(v as AuditResource | "all");
                setPage(0);
              }
            }}
          >
            <SelectTrigger
              size="sm"
              className="hidden h-6.5 w-auto min-w-28 gap-1 rounded-md text-xs lg:flex"
            >
              <SelectValue placeholder="All resources" />
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="all">All resources</SelectItem>
              {Object.entries(RESOURCE_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>

          {/* Date range picker — hidden on small screens */}
          <Popover>
            <PopoverTrigger
              render={(props) => (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="hidden rounded-md lg:flex"
                  {...props}
                />
              )}
            >
              <CalendarIcon className="size-3.5" />
              {dateRange?.from ? (
                <span>
                  {format(dateRange.from, "LLL dd, y")}
                  {dateRange.to
                    ? ` – ${format(dateRange.to, "LLL dd, y")}`
                    : ""}
                </span>
              ) : (
                <span className="text-muted-foreground">Date range</span>
              )}
            </PopoverTrigger>
            <PopoverPopup side="bottom" align="end">
              <Calendar
                mode="range"
                numberOfMonths={2}
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range);
                  setPage(0);
                }}
              />
            </PopoverPopup>
          </Popover>

          {/* Mobile filter popover */}
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  size="xs"
                  variant="ghost"
                  className="h-7 gap-1 px-1.5 text-xs lg:hidden"
                />
              }
            >
              <FilterIcon className="size-3.5" />
            </PopoverTrigger>
            <PopoverPopup side="bottom" align="end" className="w-64">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs font-medium">
                    Action
                  </span>
                  <Select
                    items={[
                      { label: "All actions", value: "all" },
                      ...Object.entries(ACTION_LABELS).map(([v, l]) => ({
                        label: l,
                        value: v,
                      })),
                    ]}
                    value={actionFilter}
                    onValueChange={(v) => {
                      if (v) {
                        setActionFilter(v as AuditAction | "all");
                        setPage(0);
                      }
                    }}
                  >
                    <SelectTrigger
                      size="sm"
                      className="h-7 w-full gap-1 rounded-md text-xs"
                    >
                      <SelectValue placeholder="All actions" />
                    </SelectTrigger>
                    <SelectPopup>
                      <SelectItem value="all">All actions</SelectItem>
                      {Object.entries(ACTION_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs font-medium">
                    Resource
                  </span>
                  <Select
                    items={[
                      { label: "All resources", value: "all" },
                      ...Object.entries(RESOURCE_LABELS).map(([v, l]) => ({
                        label: l,
                        value: v,
                      })),
                    ]}
                    value={resourceFilter}
                    onValueChange={(v) => {
                      if (v) {
                        setResourceFilter(v as AuditResource | "all");
                        setPage(0);
                      }
                    }}
                  >
                    <SelectTrigger
                      size="sm"
                      className="h-7 w-full gap-1 rounded-md text-xs"
                    >
                      <SelectValue placeholder="All resources" />
                    </SelectTrigger>
                    <SelectPopup>
                      <SelectItem value="all">All resources</SelectItem>
                      {Object.entries(RESOURCE_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs font-medium">
                    Date range
                  </span>
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          type="button"
                          variant="outline"
                          className="h-7 w-full justify-start text-xs font-normal"
                        />
                      }
                    >
                      <CalendarIcon className="size-3.5" />
                      {dateRange?.from ? (
                        <span>
                          {format(dateRange.from, "LLL dd")}
                          {dateRange.to
                            ? ` – ${format(dateRange.to, "LLL dd")}`
                            : ""}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Pick dates
                        </span>
                      )}
                    </PopoverTrigger>
                    <PopoverPopup side="bottom" align="start">
                      <Calendar
                        mode="range"
                        numberOfMonths={1}
                        selected={dateRange}
                        onSelect={(range) => {
                          setDateRange(range);
                          setPage(0);
                        }}
                      />
                    </PopoverPopup>
                  </Popover>
                </div>
              </div>
            </PopoverPopup>
          </Popover>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="border-border bg-background flex shrink-0 flex-wrap items-center gap-1.5 border-b px-3 py-1.5">
            <span className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase 2xl:text-xs">
              Filters
            </span>
            {actionFilter !== "all" && (
              <FilterChip
                label="Action"
                value={ACTION_LABELS[actionFilter]}
                onClear={() => {
                  setActionFilter("all");
                  setPage(0);
                }}
              />
            )}
            {resourceFilter !== "all" && (
              <FilterChip
                label="Resource"
                value={RESOURCE_LABELS[resourceFilter]}
                onClear={() => {
                  setResourceFilter("all");
                  setPage(0);
                }}
              />
            )}
            {dateRange?.from && (
              <FilterChip
                label="Dates"
                value={`${format(dateRange.from, "LLL dd, y")}${dateRange.to ? ` – ${format(dateRange.to, "LLL dd, y")}` : ""}`}
                onClear={() => {
                  setDateRange(undefined);
                  setPage(0);
                }}
              />
            )}
          </div>
        )}

        {/* Table */}
        <div className="relative flex-1 overflow-auto pb-10">
          <table className="w-full border-collapse text-xs whitespace-nowrap 2xl:text-sm">
            <thead className="bg-background sticky top-0 z-10">
              <tr>
                {/* Expand column */}
                <th className="border-border w-8 border-b" />
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className={cn(
                      "border-border text-muted-foreground border-b px-2 text-left text-[11px] font-medium tracking-wide uppercase 2xl:text-xs",
                      "py-1.5",
                      col.id === "actor" && "hidden sm:table-cell",
                      col.id === "resource" && "hidden md:table-cell",
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!selectedEventId ? (
                <tr>
                  <td
                    colSpan={tableColumnCount}
                    className="text-muted-foreground py-12 text-center text-sm"
                  >
                    Select an event to view audit log.
                  </td>
                </tr>
              ) : listQuery.isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="pointer-events-none opacity-0">
                    {Array.from({ length: tableColumnCount }).map((_, j) => (
                      <td key={j}>&nbsp;</td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={tableColumnCount}
                    className="text-muted-foreground py-12 text-center text-sm"
                  >
                    No activity recorded.
                  </td>
                </tr>
              ) : (
                data.map((entry) => (
                  <>
                    <tr
                      key={entry.id}
                      className={cn(
                        "border-border hover:bg-muted/30 border-b transition-colors last:border-b-0",
                        "cursor-pointer",
                        expandedRowId === entry.id && "bg-muted/20",
                      )}
                      onClick={() => handleRowClick(entry)}
                    >
                      {/* Expand indicator */}
                      <td className="px-2 py-1.5">
                        {isComplexEntry(entry) ? (
                          <ChevronDownIcon className="text-muted-foreground size-3" />
                        ) : (
                          <ExpandIcon
                            className={cn(
                              "text-muted-foreground size-3 transition-transform",
                              expandedRowId === entry.id && "rotate-90",
                            )}
                          />
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="px-2 py-1.5 tabular-nums">
                        <span
                          title={format(
                            new Date(entry.createdAt),
                            "MMM d, yyyy 'at' h:mm:ss a",
                          )}
                          className="text-muted-foreground"
                        >
                          {formatDistanceToNow(new Date(entry.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </td>

                      {/* Actor */}
                      <td className="hidden px-2 py-1.5 sm:table-cell">
                        <span className="font-medium">
                          {entry.actor.firstName} {entry.actor.lastName}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-2 py-1.5">
                        <ActionBadge action={entry.action} />
                      </td>

                      {/* Resource */}
                      <td className="hidden px-2 py-1.5 md:table-cell">
                        <span className="text-muted-foreground">
                          {RESOURCE_LABELS[entry.resource] ?? entry.resource}
                        </span>
                      </td>

                      {/* Summary */}
                      <td className="px-2 py-1.5">
                        <span className="text-muted-foreground inline-block max-w-xs truncate">
                          {generateSummary(entry)}
                        </span>
                        {isComplexEntry(entry) && (
                          <span className="text-muted-foreground ml-1.5 text-[10px]">
                            +{entry.childCount} entries
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded row (simple entries only) */}
                    {expandedRowId === entry.id && !isComplexEntry(entry) && (
                      <ExpandedRow
                        key={`${entry.id}-expanded`}
                        entry={entry}
                        colSpan={tableColumnCount}
                      />
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
          {listQuery.isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* ── Right sidebar ── */}
      <AuditSidebar
        stats={statsQuery.data}
        isLoadingStats={statsQuery.isLoading}
      />

      {/* ── Fixed footer ── */}
      <div
        className="border-border bg-background fixed right-0 bottom-0 z-30 flex items-center justify-between border-t px-3 py-1.5 transition-[left] duration-200 ease-linear xl:right-[320px]"
        style={{
          left: isMobile
            ? 0
            : `var(--sidebar-width${sidebarState === "collapsed" ? "-icon" : ""})`,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs 2xl:text-sm">
            {total === 0
              ? "No entries"
              : `${start}\u2013${end} of ${total.toLocaleString()} entries`}
          </span>
          <div className="bg-border mx-0.5 h-4 w-px" />
          <span className="text-muted-foreground text-xs 2xl:text-sm">
            Rows per page
          </span>
          <Select
            items={PAGE_SIZE_OPTIONS}
            value={String(limit)}
            onValueChange={(v) => {
              if (v) {
                setLimit(Number(v));
                setPage(0);
              }
            }}
          >
            <SelectTrigger size="sm" className="w-auto min-w-0 gap-1">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground mr-1 text-xs 2xl:text-sm">
            Page {page + 1} of {Math.max(1, totalPages)}
          </span>
          <Button
            size="xs"
            variant="ghost"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="size-6 p-0"
          >
            <ChevronLeftIcon className="size-3.5" />
          </Button>
          <Button
            size="xs"
            variant="ghost"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="size-6 p-0"
          >
            <ChevronRightIcon className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Children detail sheet ── */}
      <ChildrenSheet
        entry={sheetEntry}
        orgSlug={orgSlug}
        eventId={selectedEventId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}

function FilterChip({
  label,
  value,
  onClear,
}: {
  label: string;
  value: string;
  onClear: () => void;
}) {
  return (
    <span className="border-border bg-muted/40 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] 2xl:text-xs">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
      <button
        type="button"
        onClick={onClear}
        className="hover:text-foreground text-muted-foreground ml-0.5"
        aria-label={`Clear ${label} filter`}
      >
        <XIcon className="size-3" />
      </button>
    </span>
  );
}
