import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/components/utils/cn";
import {
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  DownloadIcon,
  FilterIcon,
  RowsIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export interface DataGridFilter {
  id: string;
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}

export interface DataGridPagination {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant?: "destructive" | "default";
  onClick: (selectedIds: string[]) => void;
}

const PAGE_SIZE_OPTIONS = [
  { label: "20", value: "20" },
  { label: "50", value: "50" },
  { label: "100", value: "100" },
];

interface EditingCell {
  rowId: string;
  columnId: string;
}

export interface DataGridProps<T extends { id: string }> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  pagination: DataGridPagination;
  storageKey: string;
  nonHideableColumnIds?: string[];
  onExport?: () => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: DataGridFilter[];
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  onRowClick?: (row: T) => void;
  onCellEdit?: (rowId: string, columnId: string, value: unknown) => void;
  bulkActions?: BulkAction[];
  emptyMessage?: string;
  itemLabel?: string;
}

function InlineEditCell({
  value,
  type = "text",
  onCommit,
  onCancel,
}: {
  value: string | number;
  type?: "text" | "number";
  onCommit: (value: string | number) => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(String(value ?? ""));

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <input
      ref={inputRef}
      type={type}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onCommit(type === "number" ? Number(localValue) : localValue);
        }
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
      onBlur={() =>
        onCommit(type === "number" ? Number(localValue) : localValue)
      }
      className="bg-background border-ring ring-ring/24 -my-0.5 h-6 w-full min-w-0 rounded border px-1.5 text-xs shadow-sm ring-1 outline-none"
    />
  );
}

export function DataGrid<T extends { id: string }>({
  columns,
  data,
  pagination,
  storageKey,
  nonHideableColumnIds,
  onExport,
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters,
  sorting,
  onSortingChange,
  onRowClick,
  onCellEdit,
  bulkActions,
  emptyMessage = "No results found",
  itemLabel = "items",
}: DataGridProps<T>) {
  type Density = "comfortable" | "compact";

  const { state: sidebarState, isMobile } = useSidebar();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteAction, setPendingDeleteAction] =
    useState<BulkAction | null>(null);

  const columnsStorageKey = `s2s:datagrid:${storageKey}:columns`;
  const densityStorageKey = `s2s:datagrid:${storageKey}:density`;

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(columnsStorageKey);
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(columnsStorageKey, JSON.stringify(columnVisibility));
    } catch { /* ignore */ }
  }, [columnVisibility, columnsStorageKey]);

  const [density, setDensity] = useState<Density>(() => {
    if (typeof window === "undefined") return "comfortable";
    try {
      const raw = window.localStorage.getItem(densityStorageKey);
      return raw === "compact" ? "compact" : "comfortable";
    } catch {
      return "comfortable";
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(densityStorageKey, density);
    } catch { /* ignore */ }
  }, [density, densityStorageKey]);

  const allColumns: ColumnDef<T, unknown>[] = bulkActions
    ? [
        {
          id: "select",
          header: ({ table }) => (
            <div className="flex items-center">
              <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                indeterminate={table.getIsSomePageRowsSelected()}
                onCheckedChange={(checked) =>
                  table.toggleAllPageRowsSelected(!!checked)
                }
                aria-label="Select all rows"
              />
            </div>
          ),
          cell: ({ row }) => (
            <div
              className="flex cursor-default items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(checked) => row.toggleSelected(!!checked)}
                aria-label="Select row"
              />
            </div>
          ),
          enableSorting: false,
          size: 32,
        },
        ...columns,
      ]
    : columns;

  const table = useReactTable({
    columns: allColumns,
    data,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    rowCount: pagination.total,
    state: {
      sorting: sorting ?? [],
      rowSelection,
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(sorting ?? []) : updater;
      onSortingChange?.(next);
    },
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    enableRowSelection: !!bulkActions,
  });

  const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k]);

  const activeFilters = (filters ?? []).filter(
    (f) => f.value !== f.options[0]?.value,
  );
  const hasActiveFilters = activeFilters.length > 0;

  const hideableColumns = table
    .getAllLeafColumns()
    .filter(
      (col) =>
        col.id !== "select" &&
        !(nonHideableColumnIds ?? []).includes(col.id),
    );

  const handleCellDoubleClick = useCallback(
    (rowId: string, columnId: string) => {
      if (!onCellEdit) return;
      if (columnId === "select") return;
      const col = columns.find(
        (c) =>
          (c as { accessorKey?: string }).accessorKey === columnId ||
          (c as { id?: string }).id === columnId,
      );
      if (!col?.meta || !(col.meta as Record<string, unknown>).editable) return;
      setEditingCell({ rowId, columnId });
    },
    [columns, onCellEdit],
  );

  const handleSortClick = useCallback(
    (columnId: string) => {
      if (!onSortingChange) return;
      const current = sorting ?? [];
      const existing = current.find((s) => s.id === columnId);

      if (!existing) {
        onSortingChange([{ id: columnId, desc: false }]);
      } else if (!existing.desc) {
        onSortingChange([{ id: columnId, desc: true }]);
      } else {
        onSortingChange([]);
      }
    },
    [sorting, onSortingChange],
  );

  const { page, limit, total, onPageChange, onLimitChange } = pagination;
  const totalPages = Math.ceil(total / limit);
  const start = total === 0 ? 0 : page * limit + 1;
  const end = Math.min((page + 1) * limit, total);

  return (
    <div className="bg-background flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* ── Toolbar (fixed) ── */}
      <div className="border-border bg-muted/40 flex shrink-0 items-center gap-1.5 border-b px-3 py-1.5">
        {onSearchChange && (
          <div className="relative min-w-0 flex-1 sm:max-w-56">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2" />
            <input
              type="text"
              value={search ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="bg-background border-border focus:border-ring h-7 w-full rounded-md border pr-2 pl-7 text-xs transition-colors outline-none"
            />
          </div>
        )}
        {/* Inline filters — hidden on small screens */}
        {filters?.map((filter) => (
          <Select
            key={filter.id}
            items={filter.options}
            value={filter.value}
            onValueChange={(v) => v && filter.onChange(v)}
          >
            <SelectTrigger
              size="sm"
              className="hidden h-7 w-auto min-w-24 gap-1 text-xs lg:flex"
            >
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectPopup>
              {filter.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        ))}
        {/* Filter popover — visible on small screens only */}
        {filters && filters.length > 0 && (
          <Popover>
            <PopoverTrigger
              render={<Button size="xs" variant="ghost" className="h-7 gap-1 px-1.5 text-xs lg:hidden" />}
            >
              <FilterIcon className="size-3.5" />
            </PopoverTrigger>
            <PopoverPopup side="bottom" align="end" className="w-56">
              <div className="flex flex-col gap-3">
                {filters.map((filter) => (
                  <div key={filter.id} className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-xs font-medium">{filter.label}</span>
                    <Select
                      items={filter.options}
                      value={filter.value}
                      onValueChange={(v) => v && filter.onChange(v)}
                    >
                      <SelectTrigger size="sm" className="h-7 w-full gap-1 text-xs">
                        <SelectValue placeholder={filter.label} />
                      </SelectTrigger>
                      <SelectPopup>
                        {filter.options.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectPopup>
                    </Select>
                  </div>
                ))}
              </div>
            </PopoverPopup>
          </Popover>
        )}
        {/* Operator toolbar — right-aligned */}
        <div className="ml-auto flex items-center gap-1.5">
          {/* Columns popover */}
          <Popover>
            <PopoverTrigger
              render={<Button size="xs" variant="ghost" className="h-7 gap-1 px-1.5 text-xs" />}
            >
              <SlidersHorizontalIcon className="size-3.5" />
              <span className="hidden sm:inline">Columns</span>
            </PopoverTrigger>
            <PopoverPopup side="bottom" align="end" className="w-52">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground px-1 pb-1 text-[10px] font-semibold tracking-widest uppercase">
                  Toggle columns
                </span>
                {hideableColumns.map((col) => {
                  const header = col.columnDef.header;
                  const label = typeof header === "string" ? header : col.id;
                  return (
                    <label
                      key={col.id}
                      className="hover:bg-muted/40 flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-xs"
                    >
                      <Checkbox
                        checked={col.getIsVisible()}
                        onCheckedChange={(checked) => col.toggleVisibility(!!checked)}
                      />
                      <span>{label}</span>
                    </label>
                  );
                })}
              </div>
            </PopoverPopup>
          </Popover>
          {/* Density popover */}
          <Popover>
            <PopoverTrigger
              render={<Button size="xs" variant="ghost" className="h-7 gap-1 px-1.5 text-xs" />}
            >
              <RowsIcon className="size-3.5" />
              <span className="hidden sm:inline">Density</span>
            </PopoverTrigger>
            <PopoverPopup side="bottom" align="end" className="w-40">
              <div className="flex flex-col gap-0.5">
                {(["comfortable", "compact"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDensity(d)}
                    className={cn(
                      "hover:bg-muted/40 flex items-center justify-between rounded px-2 py-1 text-left text-xs",
                      density === d && "bg-muted/40 font-medium",
                    )}
                  >
                    <span className="capitalize">{d}</span>
                    {density === d && (
                      <span className="text-muted-foreground text-[10px]">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </PopoverPopup>
          </Popover>
          {/* Export button */}
          {onExport && (
            <Button
              size="xs"
              variant="ghost"
              onClick={onExport}
              className="h-7 gap-1 px-1.5 text-xs"
            >
              <DownloadIcon className="size-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          )}
        </div>
      </div>
      {/* ── Active filter chips ── */}
      {hasActiveFilters && (
        <div className="border-border bg-background flex shrink-0 flex-wrap items-center gap-1.5 border-b px-3 py-1.5">
          <span className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
            Filters
          </span>
          {activeFilters.map((filter) => {
            const activeLabel =
              filter.options.find((o) => o.value === filter.value)?.label ??
              filter.value;
            return (
              <span
                key={filter.id}
                className="border-border bg-muted/40 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px]"
              >
                <span className="text-muted-foreground">{filter.label}:</span>
                <span className="font-medium">{activeLabel}</span>
                <button
                  type="button"
                  onClick={() => filter.onChange(filter.options[0]?.value ?? "")}
                  className="hover:text-foreground text-muted-foreground ml-0.5"
                  aria-label={`Clear ${filter.label} filter`}
                >
                  <XIcon className="size-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* ── Floating bulk actions toolbar ── */}
      {selectedIds.length > 0 && bulkActions && (
        <div className="bg-popover border-border fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1.5 rounded-md border px-3 py-2 shadow-lg">
          <span className="text-muted-foreground text-xs font-medium">
            {selectedIds.length} selected
          </span>
          <div className="bg-border mx-0.5 h-4 w-px" />
          {bulkActions.map((action) => (
            <Button
              key={action.id}
              size="xs"
              variant={
                action.variant === "destructive" ? "destructive" : "ghost"
              }
              onClick={() => {
                if (action.variant === "destructive") {
                  setPendingDeleteAction(action);
                  setDeleteConfirmOpen(true);
                } else {
                  action.onClick(selectedIds);
                }
              }}
              className="h-6 gap-1 px-1.5 text-xs"
            >
              {action.icon}
              <span className="hidden sm:inline">{action.label}</span>
            </Button>
          ))}
          <div className="bg-border mx-0.5 h-4 w-px" />
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={() => setRowSelection({})}
          >
            <XIcon className="size-3" />
          </Button>
        </div>
      )}

      {/* ── Scrollable Table ── */}
      <div data-density={density} className="flex-1 overflow-auto pb-10">
        <table className={cn(
          "w-full border-collapse whitespace-nowrap",
          density === "compact" ? "text-[11px]" : "text-xs",
        )}>
          <thead className="bg-background sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDir = (sorting ?? []).find(
                    (s) => s.id === header.id,
                  );
                  const meta = header.column.columnDef.meta as
                    | Record<string, string>
                    | undefined;

                  return (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={cn(
                        "border-border text-muted-foreground border-b px-2 text-left text-[11px] font-medium tracking-wide uppercase",
                        density === "compact" ? "py-1" : "py-1.5",
                        meta?.headerClassName,
                        canSort && "cursor-pointer select-none",
                      )}
                      onClick={() => canSort && handleSortClick(header.id)}
                    >
                      <div className="flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                        {sortDir && !sortDir.desc && (
                          <ChevronUpIcon className="size-3 opacity-70" />
                        )}
                        {sortDir?.desc && (
                          <ChevronDownIcon className="size-3 opacity-70" />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={allColumns.length}
                  className="text-muted-foreground py-12 text-center text-sm"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className={`border-border hover:bg-muted/30 data-[state=selected]:bg-muted/50 border-b transition-colors last:border-b-0 ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isEditing =
                      editingCell?.rowId === row.id &&
                      editingCell?.columnId === cell.column.id;
                    const meta = cell.column.columnDef.meta as
                      | Record<string, unknown>
                      | undefined;

                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          "px-2",
                          density === "compact" ? "py-1" : "py-1.5",
                          meta?.cellClassName as string | undefined,
                        )}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleCellDoubleClick(row.id, cell.column.id);
                        }}
                      >
                        {isEditing ? (
                          <InlineEditCell
                            value={cell.getValue() as string | number}
                            type={
                              (meta?.editType as "text" | "number") ?? "text"
                            }
                            onCommit={(value) => {
                              onCellEdit?.(row.id, cell.column.id, value);
                              setEditingCell(null);
                            }}
                            onCancel={() => setEditingCell(null)}
                          />
                        ) : (
                          flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer (fixed to viewport bottom) ── */}
      <div
        className="border-border bg-background fixed right-0 bottom-0 z-30 flex items-center justify-between border-t px-3 py-1.5 transition-[left] duration-200 ease-linear"
        style={{
          left: isMobile
            ? 0
            : `var(--sidebar-width${sidebarState === "collapsed" ? "-icon" : ""})`,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {total === 0
              ? `No ${itemLabel}`
              : `${start}\u2013${end} of ${total.toLocaleString()} ${itemLabel}`}
          </span>
          {onLimitChange && (
            <>
              <div className="bg-border mx-0.5 h-4 w-px" />
              <span className="text-muted-foreground text-xs">
                Rows per page
              </span>
              <Select
                items={PAGE_SIZE_OPTIONS}
                value={String(limit)}
                onValueChange={(v) => {
                  if (v) {
                    onLimitChange(Number(v));
                    onPageChange(0);
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
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground mr-1 text-xs">
            Page {page + 1} of {Math.max(1, totalPages)}
          </span>
          <Button
            size="xs"
            variant="ghost"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
            className="size-6 p-0"
          >
            <ChevronLeftIcon className="size-3.5" />
          </Button>
          <Button
            size="xs"
            variant="ghost"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
            className="size-6 p-0"
          >
            <ChevronRightIcon className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Delete confirmation ── */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.length} {itemLabel}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {selectedIds.length} {itemLabel} from
              the roster. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>
              Cancel
            </AlertDialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                pendingDeleteAction?.onClick(selectedIds);
                setDeleteConfirmOpen(false);
                setPendingDeleteAction(null);
                setRowSelection({});
              }}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  );
}

export function StatusBadge({ isRegistered }: { isRegistered: boolean }) {
  return isRegistered ? (
    <Badge variant="success" size="sm">
      Active
    </Badge>
  ) : (
    <Badge variant="outline" size="sm">
      Pending
    </Badge>
  );
}

