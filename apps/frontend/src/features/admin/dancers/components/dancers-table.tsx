import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Frame, FrameFooter } from "@/components/ui/frame";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/components/utils/format";
import type { ApiSchemas } from "@/lib/api/client";
import { dateToRelativeTime } from "@/utils/date";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { DancersPagination } from "./dancers-pagination";

type Dancer = ApiSchemas["AdminDancersResponse"]["dancers"][number];
type Pagination = ApiSchemas["AdminDancersResponse"]["pagination"];

interface DancersTableProps {
  dancers: Dancer[];
  pagination: Pagination;
  isLoading?: boolean;
}

const columns: ColumnDef<Dancer>[] = [
  {
    id: "dancer",
    accessorFn: (row) => row.user.name,
    header: "Dancer",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar className="size-10">
          <AvatarImage src={row.original.user.avatar ?? undefined} />
          <AvatarFallback>
            {row.original.user.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <span className="font-medium">{row.original.user.name}</span>
          <Link
            to="/$username"
            params={{ username: row.original.user.username }}
            className="text-brand flex items-center gap-1 text-sm hover:underline"
          >
            @{row.original.user.username}
            <ExternalLinkIcon className="size-3 shrink-0" />
          </Link>
        </div>
      </div>
    ),
  },
  {
    id: "email",
    accessorFn: (row) => row.user.email,
    header: "Email",
  },
  {
    id: "verified",
    accessorFn: (row) => row.user.verified,
    header: "Verified",
    cell: ({ row }) =>
      row.original.user.verified ? (
        <Badge variant="secondary" className="gap-1">
          <CheckIcon className="size-3" />
          Yes
        </Badge>
      ) : (
        <span className="text-muted-foreground flex items-center gap-1">
          <XIcon className="size-3" />
          No
        </span>
      ),
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) =>
      row.original.location || (
        <span className="text-muted-foreground">-</span>
      ),
  },
  {
    accessorKey: "gradYear",
    header: "Grad Year",
    cell: ({ row }) =>
      row.original.gradYear ?? (
        <span className="text-muted-foreground">-</span>
      ),
  },
  {
    accessorKey: "gpa",
    header: "GPA",
    cell: ({ row }) =>
      row.original.gpa ?? <span className="text-muted-foreground">-</span>,
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => (
      <span
        title={formatDate(row.original.createdAt)}
        className="text-muted-foreground"
      >
        {dateToRelativeTime(row.original.createdAt, { strict: true })}
      </span>
    ),
  },
];

const columnVisibility: Record<string, string> = {
  email: "hidden sm:table-cell",
  verified: "hidden sm:table-cell",
  location: "hidden lg:table-cell",
  gradYear: "hidden md:table-cell",
  gpa: "hidden md:table-cell",
  createdAt: "hidden sm:table-cell",
};

export function DancersTable({
  dancers,
  pagination,
  isLoading,
}: DancersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    columns,
    data: dancers,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  if (dancers.length === 0) {
    return <p className="text-muted-foreground">No dancers found</p>;
  }

  return (
    <Frame className={isLoading ? "opacity-50" : undefined}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow className="hover:bg-transparent" key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={columnVisibility[header.id]}
                >
                  {header.isPlaceholder ? null : (
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
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={columnVisibility[cell.column.id]}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <FrameFooter className="p-2">
        <DancersPagination pagination={pagination} />
      </FrameFooter>
    </Frame>
  );
}
