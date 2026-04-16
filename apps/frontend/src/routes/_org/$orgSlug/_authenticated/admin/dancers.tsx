import { toastManager } from "@/components/ui/toast-manager";
import { adminQueries } from "@/features/org/api/admin-queries";
import { toastRosterMutationError } from "@/features/org/api/roster-mutation-error";
import {
  type RosterEntry,
  type RosterStatus,
  downloadRosterCsv,
  rosterQueries,
  useDeleteRosters,
  useResendInvites,
  useUpdateRoster,
} from "@/features/org/api/roster-queries";
import { DataGrid, StatusBadge } from "@/features/org/components/data-grid";
import { rosterBulkActions } from "@/features/org/components/roster-bulk-actions";
import { RosterDetailSheet } from "@/features/org/components/roster-detail-sheet";
import { RosterPageHeader } from "@/features/org/components/roster-page-header";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { type ColumnDef, type SortingState } from "@tanstack/react-table";
import { useCallback, useEffect, useRef, useState } from "react";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/admin/dancers",
)({
  component: DancersPage,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMeta = any;

type SortColumn =
  | "lastName"
  | "firstName"
  | "email"
  | "bibNumber"
  | "organization"
  | "createdAt"
  | "isRegistered";

const columns: ColumnDef<RosterEntry, unknown>[] = [
  {
    id: "bibNumber",
    accessorKey: "bibNumber",
    header: "Bib #",
    size: 80,
    meta: { editable: true, editType: "number" } as AnyMeta,
    cell: ({ row }) => (
      <span className="font-medium tabular-nums">
        {row.original.bibNumber ?? "-"}
      </span>
    ),
  },
  {
    id: "lastName",
    accessorFn: (row) => `${row.lastName}, ${row.firstName}`,
    header: "Name",
    meta: { editable: true } as AnyMeta,
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.firstName} {row.original.lastName}
      </span>
    ),
  },
  {
    id: "email",
    accessorKey: "email",
    header: "Email",
    meta: {
      editable: true,
      cellClassName: "hidden sm:table-cell",
      headerClassName: "hidden sm:table-cell",
    } as AnyMeta,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.email}</span>
    ),
  },
  {
    id: "organization",
    accessorKey: "organization",
    header: "Organization",
    meta: {
      editable: true,
      cellClassName: "hidden md:table-cell",
      headerClassName: "hidden md:table-cell",
    } as AnyMeta,
    cell: ({ row }) =>
      row.original.organization ?? (
        <span className="text-muted-foreground">-</span>
      ),
  },
  {
    id: "isRegistered",
    accessorKey: "isRegistered",
    header: "Status",
    enableSorting: true,
    cell: ({ row }) => <StatusBadge isRegistered={row.original.isRegistered} />,
  },
];

function DancersPage() {
  const { orgSlug } = Route.useParams();
  const { data: events } = useSuspenseQuery(adminQueries.events(orgSlug));
  const active = events?.find((e) => e.isActive);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RosterStatus>("all");
  const [org, setOrg] = useState("all");
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedEntry, setSelectedEntry] = useState<RosterEntry | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const openSheetRafRef = useRef<number | null>(null);

  const sortBy = sorting[0]?.id as SortColumn | undefined;
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  const listQuery = useQuery({
    ...rosterQueries.list(orgSlug, active?.id ?? "", {
      type: "dancer",
      page,
      limit,
      search: search || undefined,
      status: status === "all" ? undefined : status,
      org: org === "all" ? undefined : org,
      sortBy,
      sortDir: sortBy ? sortDir : undefined,
    }),
    enabled: !!active,
  });

  const filtersQuery = useQuery({
    ...rosterQueries.filters(orgSlug, active?.id ?? "", "dancer"),
    enabled: !!active,
  });

  const statsQuery = useQuery({
    ...rosterQueries.stats(orgSlug, active?.id ?? "", "dancer"),
    enabled: !!active,
  });

  const data = listQuery.data?.data ?? [];
  const total = listQuery.data?.total ?? 0;
  const orgs = filtersQuery.data?.organizations ?? [];

  const updateMutation = useUpdateRoster();
  const deleteMutation = useDeleteRosters();
  const resendMutation = useResendInvites();

  const handleRowClick = (row: RosterEntry) => {
    setSelectedEntry(row);
    if (openSheetRafRef.current !== null) {
      cancelAnimationFrame(openSheetRafRef.current);
    }
    openSheetRafRef.current = requestAnimationFrame(() => {
      setSheetOpen(true);
      openSheetRafRef.current = null;
    });
  };

  useEffect(() => {
    return () => {
      if (openSheetRafRef.current !== null) {
        cancelAnimationFrame(openSheetRafRef.current);
      }
    };
  }, []);

  const handleCellEdit = useCallback(
    async (rowId: string, columnId: string, value: unknown) => {
      if (!active) return;
      const body: Record<string, unknown> = {};

      if (columnId === "bibNumber") {
        body.bibNumber = value ? Number(value) : null;
      } else if (columnId === "lastName") {
        const parts = String(value).trim().split(" ");
        body.firstName = parts[0] ?? "";
        body.lastName = parts.slice(1).join(" ") || "";
      } else if (columnId === "email") {
        body.email = String(value);
      } else if (columnId === "organization") {
        body.organization = String(value) || null;
      } else {
        return;
      }

      try {
        await updateMutation.mutateAsync({
          params: {
            path: { slug: orgSlug, id: active.id, rosterId: rowId },
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          body: body as any,
        });
        toastManager.add({ title: "Updated", type: "success" });
      } catch (err) {
        toastRosterMutationError(err);
      }
    },
    [active, orgSlug, updateMutation],
  );

  const handleExport = useCallback(async () => {
    if (!active) return;
    try {
      await downloadRosterCsv(orgSlug, active.id, {
        type: "dancer",
        search: search || undefined,
        status: status === "all" ? undefined : status,
        org: org === "all" ? undefined : org,
      });
    } catch {
      toastManager.add({ title: "Export failed", type: "error" });
    }
  }, [active, orgSlug, search, status, org]);

  const bulkActions = rosterBulkActions({
    onExport: handleExport,
    onResendInvite: async (ids: string[]) => {
      if (!active) return;
      toastManager.add({
        title: `Resending invites to ${ids.length} dancer${ids.length === 1 ? "" : "s"}…`,
        type: "info",
      });
      try {
        const result = await resendMutation.mutateAsync({
          params: { path: { slug: orgSlug, id: active.id } },
          body: { ids },
        });
        if (result.failed.length > 0) {
          toastManager.add({
            title: `Resent ${result.sent}, ${result.failed.length} failed`,
            type: "warning",
          });
        } else {
          toastManager.add({
            title: `Resent ${result.sent} invite${result.sent === 1 ? "" : "s"}${result.skipped ? ` (${result.skipped} skipped)` : ""}`,
            type: "success",
          });
        }
      } catch {
        toastManager.add({ title: "Failed to resend invites", type: "error" });
      }
    },
    onDelete: async (ids: string[]) => {
      if (!active) return;
      try {
        await deleteMutation.mutateAsync({
          params: {
            path: { slug: orgSlug, id: active.id },
            query: { ids },
          },
        });
        toastManager.add({
          title: `${ids.length} dancer${ids.length === 1 ? "" : "s"} deleted`,
          type: "success",
        });
      } catch {
        toastManager.add({ title: "Failed to delete dancers", type: "error" });
      }
    },
  });

  if (!active) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
        No active event.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <RosterPageHeader
        title="Dancers"
        eventName={active.name}
        stats={{
          total: statsQuery.data?.total ?? 0,
          active: statsQuery.data?.active ?? 0,
          pending: statsQuery.data?.pending ?? 0,
          orgCount: filtersQuery.data?.organizations.length ?? 0,
        }}
        isLoading={statsQuery.isLoading}
        status={status}
        onStatusChange={(next) => {
          setStatus(next);
          setPage(0);
        }}
      />
      <DataGrid
        storageKey="roster-dancers"
        columns={columns}
        data={data}
        pagination={{
          page,
          limit,
          total,
          onPageChange: setPage,
          onLimitChange: setLimit,
        }}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(0);
        }}
        searchPlaceholder="Search by name, email, bib #..."
        filters={[
          {
            id: "org",
            label: "Organization",
            value: org,
            onChange: (v) => {
              setOrg(v);
              setPage(0);
            },
            options: [
              { label: "All orgs", value: "all" },
              ...orgs.map((o) => ({ label: o, value: o })),
            ],
          },
        ]}
        sorting={sorting}
        onSortingChange={setSorting}
        onRowClick={handleRowClick}
        onCellEdit={handleCellEdit}
        bulkActions={bulkActions}
        onExport={handleExport}
        nonHideableColumnIds={["lastName"]}
        emptyMessage={
          listQuery.isLoading ? "Loading dancers…" : "No dancers found"
        }
        itemLabel="dancers"
      />

      <RosterDetailSheet
        entry={selectedEntry}
        orgSlug={orgSlug}
        eventId={active.id}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
