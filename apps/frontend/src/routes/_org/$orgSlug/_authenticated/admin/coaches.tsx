import { toastManager } from "@/components/ui/toast-manager";
import { adminQueries } from "@/features/org/api/admin-queries";
import {
  type RosterEntry,
  type RosterStatus,
  downloadRosterCsv,
  rosterQueries,
  useDeleteRosters,
  useUpdateRoster,
} from "@/features/org/api/roster-queries";
import {
  DataGrid,
  StatusBadge,
  rosterBulkActions,
} from "@/features/org/components/data-grid";
import { RosterDetailSheet } from "@/features/org/components/roster-detail-sheet";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { type ColumnDef, type SortingState } from "@tanstack/react-table";
import { useCallback, useState } from "react";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/admin/coaches",
)({
  component: CoachesPage,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMeta = any;

type SortColumn =
  | "lastName"
  | "firstName"
  | "email"
  | "organization"
  | "createdAt"
  | "isRegistered";

const columns: ColumnDef<RosterEntry, unknown>[] = [
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

function CoachesPage() {
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

  const sortBy = sorting[0]?.id as SortColumn | undefined;
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  const listQuery = useQuery({
    ...rosterQueries.list(orgSlug, active?.id ?? "", {
      type: "coach",
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
    ...rosterQueries.filters(orgSlug, active?.id ?? "", "coach"),
    enabled: !!active,
  });

  const data = listQuery.data?.data ?? [];
  const total = listQuery.data?.total ?? 0;
  const orgs = filtersQuery.data?.organizations ?? [];

  const updateMutation = useUpdateRoster();
  const deleteMutation = useDeleteRosters();

  const handleRowClick = useCallback((row: RosterEntry) => {
    setSelectedEntry(row);
    setSheetOpen(true);
  }, []);

  const handleCellEdit = useCallback(
    async (rowId: string, columnId: string, value: unknown) => {
      if (!active) return;
      const body: Record<string, unknown> = {};

      if (columnId === "lastName") {
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
        const code = (err as { data?: { code?: string } })?.data?.code;
        if (code === "ROSTER_ACTIVE_READONLY") {
          toastManager.add({
            title: "Can't edit an active roster entry",
            type: "error",
          });
        } else if (code === "ROSTER_EMAIL_CONFLICT") {
          toastManager.add({
            title: "That email is already on this roster",
            type: "error",
          });
        } else {
          toastManager.add({ title: "Failed to update coach", type: "error" });
        }
      }
    },
    [active, orgSlug, updateMutation],
  );

  const bulkActions = rosterBulkActions({
    onExport: async () => {
      if (!active) return;
      try {
        await downloadRosterCsv(orgSlug, active.id, {
          type: "coach",
          search: search || undefined,
          status: status === "all" ? undefined : status,
          org: org === "all" ? undefined : org,
        });
      } catch {
        toastManager.add({ title: "Export failed", type: "error" });
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
          title: `${ids.length} coach${ids.length === 1 ? "" : "es"} deleted`,
          type: "success",
        });
      } catch {
        toastManager.add({ title: "Failed to delete coaches", type: "error" });
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
      <DataGrid
        title="Coaches"
        subtitle={`${total.toLocaleString()} on roster for ${active.name}`}
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
        searchPlaceholder="Search by name, email..."
        filters={[
          {
            id: "status",
            label: "Status",
            value: status,
            onChange: (v) => {
              setStatus(v as RosterStatus);
              setPage(0);
            },
            options: [
              { label: "Status", value: "all" },
              { label: "Active", value: "active" },
              { label: "Pending", value: "pending" },
            ],
          },
          {
            id: "org",
            label: "Organization",
            value: org,
            onChange: (v) => {
              setOrg(v);
              setPage(0);
            },
            options: [
              { label: "Organization", value: "all" },
              ...orgs.map((o) => ({ label: o, value: o })),
            ],
          },
        ]}
        sorting={sorting}
        onSortingChange={setSorting}
        onRowClick={handleRowClick}
        onCellEdit={handleCellEdit}
        bulkActions={bulkActions}
        emptyMessage={
          listQuery.isLoading ? "Loading coaches…" : "No coaches found"
        }
        itemLabel="coaches"
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
