import type { ReactNode } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDownIcon, ChevronUpIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Frame, FrameFooter } from "@/components/ui/frame";
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
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    globalFilterFn: "includesString",
    state: {
      pagination,
      sorting,
      globalFilter,
    },
  });

  const paginatedRows = table.getRowModel().rows;

  return (
    <>
      {/* Mobile Card View */}
      <div className="flex flex-col gap-2 sm:hidden">
        {isLoading ? (
          <div className="flex h-24 items-center justify-center gap-2">
            <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
            <p className="text-muted-foreground text-sm">Loading...</p>
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
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length}
                >
                  <div className="flex h-full items-center justify-center gap-2">
                    <Loader2Icon
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                    <p className="text-muted-foreground text-sm">Loading...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedRows.length ? (
              paginatedRows.map((row) => (
                <TableRow
                  className="cursor-pointer"
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
