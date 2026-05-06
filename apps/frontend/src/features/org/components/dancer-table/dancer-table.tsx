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
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Frame, FrameFooter } from "@/components/ui/frame";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
  onRowClick: (row: T) => void;
  renderCard: (row: T) => ReactNode;
  globalFilter?: string;
  sorting?: SortingState;
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
  sorting: initialSorting,
  pageSize = 25,
  enableSelection,
  rowSelection,
  onRowSelectionChange,
}: DancerTableProps<T>) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });
  const [sorting, setSorting] = useState<SortingState>(initialSorting ?? []);

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
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={`skeleton-card-${i}`}
                className="flex flex-col gap-2 rounded-lg border p-3"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-10 rounded" />
                  <Skeleton className="size-4 rounded" />
                </div>
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : paginatedRows.length ? (
          <>
            {paginatedRows.map((row) => (
              <div key={row.original.rosterId}>{renderCard(row.original)}</div>
            ))}
            <div className="flex items-center justify-between gap-2">
              {/* Results range selector */}
              <div className="flex items-center gap-2 whitespace-nowrap">
                <p className="text-muted-foreground text-sm">Viewing</p>
                <Select
                  items={Array.from(
                    { length: table.getPageCount() },
                    (_, i) => {
                      const start =
                        i * table.getState().pagination.pageSize + 1;
                      const end = Math.min(
                        (i + 1) * table.getState().pagination.pageSize,
                        table.getRowCount(),
                      );
                      const pageNum = i + 1;
                      return { label: `${start}-${end}`, value: pageNum };
                    },
                  )}
                  onValueChange={(value) => {
                    table.setPageIndex((value as number) - 1);
                  }}
                  value={table.getState().pagination.pageIndex + 1}
                >
                  <SelectTrigger
                    aria-label="Select result range"
                    className="min-w-none w-fit"
                    size="sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    {Array.from({ length: table.getPageCount() }, (_, i) => {
                      const start =
                        i * table.getState().pagination.pageSize + 1;
                      const end = Math.min(
                        (i + 1) * table.getState().pagination.pageSize,
                        table.getRowCount(),
                      );
                      const pageNum = i + 1;
                      return (
                        <SelectItem key={pageNum} value={pageNum}>
                          {`${start}-${end}`}
                        </SelectItem>
                      );
                    })}
                  </SelectPopup>
                </Select>
                <p className="text-muted-foreground text-sm">
                  of{" "}
                  <strong className="text-foreground font-medium">
                    {table.getRowCount()}
                  </strong>{" "}
                  results
                </p>
              </div>
              {/* Pagination */}
              <Pagination className="justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      className="sm:*:[svg]:hidden"
                      render={
                        <Button
                          disabled={!table.getCanPreviousPage()}
                          onClick={() => table.previousPage()}
                          size="sm"
                          variant="outline"
                        />
                      }
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      className="sm:*:[svg]:hidden"
                      render={
                        <Button
                          disabled={!table.getCanNextPage()}
                          onClick={() => table.nextPage()}
                          size="sm"
                          variant="outline"
                        />
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </>
        ) : (
          emptyState
        )}
      </div>

      {/* Desktop Table View */}
      <Frame className="hidden w-full sm:block">
        <Table>
          <TableHeader>
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
                <TableRow key={`skeleton-${i}`} className="pointer-events-none">
                  {Array.from({ length: columns.length }, (_, j) => (
                    <TableCell key={`skeleton-${i}-${j}`}>
                      <Skeleton className="h-4 w-full rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedRows.length ? (
              paginatedRows.map((row) => (
                <TableRow
                  className="group/row cursor-pointer"
                  key={row.id}
                  onClick={() => onRowClick(row.original)}
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
                  className="h-24 text-center"
                  colSpan={columns.length}
                >
                  {emptyState}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <FrameFooter className="p-2">
          <div className="flex items-center justify-between gap-2">
            {/* Results range selector */}
            <div className="flex items-center gap-2 whitespace-nowrap">
              <p className="text-muted-foreground text-sm">Viewing</p>
              <Select
                items={Array.from({ length: table.getPageCount() }, (_, i) => {
                  const start = i * table.getState().pagination.pageSize + 1;
                  const end = Math.min(
                    (i + 1) * table.getState().pagination.pageSize,
                    table.getRowCount(),
                  );
                  const pageNum = i + 1;
                  return { label: `${start}-${end}`, value: pageNum };
                })}
                onValueChange={(value) => {
                  table.setPageIndex((value as number) - 1);
                }}
                value={table.getState().pagination.pageIndex + 1}
              >
                <SelectTrigger
                  aria-label="Select result range"
                  className="min-w-none w-fit"
                  size="sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  {Array.from({ length: table.getPageCount() }, (_, i) => {
                    const start = i * table.getState().pagination.pageSize + 1;
                    const end = Math.min(
                      (i + 1) * table.getState().pagination.pageSize,
                      table.getRowCount(),
                    );
                    const pageNum = i + 1;
                    return (
                      <SelectItem key={pageNum} value={pageNum}>
                        {`${start}-${end}`}
                      </SelectItem>
                    );
                  })}
                </SelectPopup>
              </Select>
              <p className="text-muted-foreground text-sm">
                of{" "}
                <strong className="text-foreground font-medium">
                  {table.getRowCount()}
                </strong>{" "}
                results
              </p>
            </div>
            {/* Pagination */}
            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    className="sm:*:[svg]:hidden"
                    render={
                      <Button
                        disabled={!table.getCanPreviousPage()}
                        onClick={() => table.previousPage()}
                        size="sm"
                        variant="outline"
                      />
                    }
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    className="sm:*:[svg]:hidden"
                    render={
                      <Button
                        disabled={!table.getCanNextPage()}
                        onClick={() => table.nextPage()}
                        size="sm"
                        variant="outline"
                      />
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </FrameFooter>
      </Frame>
    </>
  );
}
