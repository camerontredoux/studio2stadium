import { toastManager } from "@/components/ui/toast-manager";
import { adminQueries } from "@/features/org/api/admin-queries";
import {
  DataGrid,
  StatusBadge,
  rosterBulkActions,
} from "@/features/org/components/data-grid";
import { RosterDetailSheet } from "@/features/org/components/roster-detail-sheet";
import {
  type RosterEntry,
  deleteRosterEntries,
  exportRosterCsv,
  getDistinctOrgs,
  queryRoster,
  updateRosterEntry,
} from "@/features/org/lib/mock-roster-data";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { type ColumnDef, type SortingState } from "@tanstack/react-table";
import { useCallback, useState } from "react";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/admin/dancers",
)({
  component: DancersPage,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMeta = any;

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
  const [status, setStatus] = useState("all");
  const [org, setOrg] = useState("all");
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedEntry, setSelectedEntry] = useState<RosterEntry | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const sortBy = sorting[0]?.id;
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  const result = queryRoster({
    type: "dancer",
    page,
    limit,
    search: search || undefined,
    status: status as "all" | "active" | "pending",
    org: org === "all" ? undefined : org,
    sortBy,
    sortDir: sortBy ? (sortDir as "asc" | "desc") : undefined,
  });

  const orgs = getDistinctOrgs("dancer");

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleRowClick = useCallback((row: RosterEntry) => {
    setSelectedEntry(row);
    setSheetOpen(true);
  }, []);

  const handleCellEdit = useCallback(
    (rowId: string, columnId: string, value: unknown) => {
      const updates: Record<string, unknown> = {};

      if (columnId === "bibNumber") {
        updates.bibNumber = value ? Number(value) : null;
      } else if (columnId === "lastName") {
        const parts = String(value).split(" ");
        updates.firstName = parts[0] ?? "";
        updates.lastName = parts.slice(1).join(" ") || "";
      } else {
        updates[columnId] = value;
      }

      updateRosterEntry(rowId, updates);
      refresh();
      toastManager.add({ title: "Updated", type: "success" });
    },
    [refresh],
  );

  const bulkActions = rosterBulkActions({
    onExport: (ids: string[]) => {
      const entries = result.data.filter((e) => ids.includes(e.id));
      const csv = exportRosterCsv(entries);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dancers-export.csv";
      a.click();
      URL.revokeObjectURL(url);
    },
    onResendInvite: (ids: string[]) => {
      toastManager.add({
        title: `Invites resent to ${ids.length} dancers`,
        type: "success",
      });
    },
    onDelete: (ids: string[]) => {
      deleteRosterEntries(ids);
      refresh();
      toastManager.add({
        title: `${ids.length} entries deleted`,
        type: "success",
      });
    },
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col" key={refreshKey}>
      <DataGrid
        title="Dancers"
        subtitle={`${result.total.toLocaleString()} on roster${active ? ` for ${active.name}` : ""}`}
        columns={columns}
        data={result.data}
        pagination={{
          page,
          limit,
          total: result.total,
          onPageChange: setPage,
          onLimitChange: setLimit,
        }}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email, bib #..."
        filters={[
          {
            id: "status",
            label: "Status",
            value: status,
            onChange: (v) => {
              setStatus(v);
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
        emptyMessage="No dancers found"
        itemLabel="dancers"
      />

      <RosterDetailSheet
        entry={selectedEntry}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUpdated={refresh}
      />
    </div>
  );
}
