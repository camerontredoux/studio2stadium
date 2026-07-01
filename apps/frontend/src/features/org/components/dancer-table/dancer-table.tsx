import type { ReactNode } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDownIcon, ChevronUpIcon, Loader2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Frame, FrameFooter } from "@/components/ui/frame";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DancerTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading: boolean;
  emptyState: ReactNode;
  onRowClick?: (row: T) => void;
  renderCard: (row: T) => ReactNode;
  globalFilter?: string;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  pageSize?: number;
  enableSelection?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
}

export function DancerTable<T extends { rosterId: string }>({
  data,
  columns,
  isLoading,
  emptyState,
  onRowClick,
  renderCard,
  globalFilter,
  sorting: sortingProp,
  onSortingChange: onSortingChangeProp,
  pageSize = 25,
  enableSelection,
  rowSelection,
  onRowSelectionChange,
}: DancerTableProps<T>) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const container = frame.querySelector('[data-slot="table-container"]');
    if (!container) return;

    const onScroll = () => setIsScrolled(container.scrollTop > 0);
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  const [internalSorting, setInternalSorting] = useState<SortingState>(sortingProp ?? []);
  const isControlled = onSortingChangeProp !== undefined;
  const sorting = isControlled ? (sortingProp ?? []) : internalSorting;
  const setSorting = isControlled ? onSortingChangeProp : setInternalSorting;

  const table = useReactTable({
    columns,
    data,
    enableSortingRemoval: false,
    enableRowSelection: enableSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination,
    onRowSelectionChange,
    onSortingChange: setSorting,
    globalFilterFn: "includesString",
    state: {
      pagination,
      sorting,
      globalFilter,
      ...(rowSelection !== undefined && { rowSelection }),
    },
  });

  const paginatedRows = table.getRowModel().rows;

  return (
    <>
      {/* Mobile Card View */}
      <div className="flex flex-col gap-2 sm:hidden">
        {isLoading ? (
          <div className="relative">
            <div className="pointer-events-none select-none blur-[2px] opacity-40">
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={`placeholder-${i}`}
                  className="mb-2 rounded-lg border p-3"
                >
                  <div className="h-4 w-20 rounded bg-transparent" />
                  <div className="mt-2 h-4 w-3/4 rounded bg-transparent" />
                  <div className="mt-1 h-3 w-1/2 rounded bg-transparent" />
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
            </div>
          </div>
        ) : paginatedRows.length ? (
          <>
            {paginatedRows.map((row) => (
              <div key={row.original.rosterId}>{renderCard(row.original)}</div>
            ))}
            <div className="flex items-center justify-between gap-2">
              <p className="text-muted-foreground text-sm">
                {table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                  1}
                &ndash;
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  table.getRowCount(),
                )}{" "}
                of {table.getRowCount()}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => table.previousPage()}
                  size="sm"
                  variant="outline"
                >
                  Previous
                </Button>
                <Button
                  disabled={!table.getCanNextPage()}
                  onClick={() => table.nextPage()}
                  size="sm"
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          emptyState
        )}
      </div>

      {/* Desktop Table View */}
      <Frame ref={frameRef} className="relative hidden w-full min-h-0 flex-1 overflow-hidden sm:flex sm:flex-col *:data-[slot=table-container]:min-h-0 *:data-[slot=table-container]:flex-1 *:data-[slot=table-container]:overflow-y-auto *:data-[slot=table-container]:[scrollbar-width:thin]">
        <Table className={isLoading || !paginatedRows.length ? "h-full" : ""}>
          <TableHeader className={`sticky top-0 z-10 [&_th]:transition-colors ${isScrolled ? "[&_th]:bg-[#f8f8f8] dark:[&_th]:bg-[#18181A]" : ""}`}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow className="hover:bg-transparent" key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const columnSize = header.column.getSize();
                  return (
                    <TableHead
                      key={header.id}
                      style={
                        columnSize ? { width: `${columnSize}px` } : undefined
                      }
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <div
                          className="flex h-full cursor-pointer items-center justify-between gap-2 select-none"
                          onClick={header.column.getToggleSortingHandler()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              header.column.getToggleSortingHandler()?.(e);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {{
                            asc: (
                              <ChevronUpIcon
                                aria-hidden="true"
                                className="size-4 shrink-0 opacity-80"
                              />
                            ),
                            desc: (
                              <ChevronDownIcon
                                aria-hidden="true"
                                className="size-4 shrink-0 opacity-80"
                              />
                            ),
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }, (_, i) => (
                <TableRow key={`placeholder-${i}`} className="pointer-events-none opacity-0">
                  {Array.from({ length: columns.length }, (_, j) => (
                    <TableCell key={`placeholder-${i}-${j}`}>
                      &nbsp;
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedRows.length ? (
              paginatedRows.map((row) => (
                <TableRow
                  className={`group/row${onRowClick ? " cursor-pointer" : ""}`}
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-full text-center"
                  colSpan={columns.length}
                >
                  {emptyState}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
          </div>
        )}
        <FrameFooter className="relative z-10 shrink-0 p-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <label className="text-muted-foreground text-sm">
                Rows per page
              </label>
              <Select
                items={[25, 50, 100].map((s) => ({
                  label: String(s),
                  value: s,
                }))}
                value={table.getState().pagination.pageSize}
                onValueChange={(value) => {
                  table.setPageSize(value as number);
                  table.setPageIndex(0);
                }}
              >
                <SelectTrigger
                  aria-label="Rows per page"
                  className="min-w-none w-fit"
                  size="sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  {[25, 50, 100].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
              <p className="text-muted-foreground text-sm">
                {table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                  1}
                &ndash;
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  table.getRowCount(),
                )}{" "}
                of {table.getRowCount()}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
                size="sm"
                variant="outline"
              >
                Previous
              </Button>
              <Button
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
                size="sm"
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        </FrameFooter>
      </Frame>
    </>
  );
}
