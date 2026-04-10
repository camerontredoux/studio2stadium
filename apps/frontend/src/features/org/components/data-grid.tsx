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
  MailIcon,
  SearchIcon,
  Trash2Icon,
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
  title?: string;
  subtitle?: string;
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
  title,
  subtitle,
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
  const { state: sidebarState, isMobile } = useSidebar();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteAction, setPendingDeleteAction] =
    useState<BulkAction | null>(null);

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
    },
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
        {title && (
          <>
            <span className="text-sm font-semibold">{title}</span>
            {subtitle && (
              <span className="text-muted-foreground hidden text-xs lg:inline">{subtitle}</span>
            )}
            <div className="bg-border mx-0.5 h-4 w-px" />
          </>
        )}
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
      </div>

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
      <div className="flex-1 overflow-auto pb-10">
        <table className="w-full border-collapse whitespace-nowrap text-xs">
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
                      className={`border-border text-muted-foreground border-b px-2 py-1.5 text-left text-[11px] font-medium tracking-wide uppercase ${
                        meta?.headerClassName ?? ""
                      } ${canSort ? "cursor-pointer select-none" : ""}`}
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
                        className={`px-2 py-1.5 ${(meta?.cellClassName as string) ?? ""}`}
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

export function rosterBulkActions({
  onExport,
  onResendInvite,
  onDelete,
}: {
  onExport?: (ids: string[]) => void | Promise<void>;
  onResendInvite?: (ids: string[]) => void | Promise<void>;
  onDelete?: (ids: string[]) => void | Promise<void>;
}): BulkAction[] {
  const actions: BulkAction[] = [];
  if (onExport) {
    actions.push({
      id: "export",
      label: "Export",
      icon: <DownloadIcon className="size-3" />,
      onClick: onExport,
    });
  }
  if (onResendInvite) {
    actions.push({
      id: "resend-invite",
      label: "Resend invite",
      icon: <MailIcon className="size-3" />,
      onClick: onResendInvite,
    });
  }
  if (onDelete) {
    actions.push({
      id: "delete",
      label: "Delete",
      icon: <Trash2Icon className="size-3" />,
      variant: "destructive",
      onClick: onDelete,
    });
  }
  return actions;
}
