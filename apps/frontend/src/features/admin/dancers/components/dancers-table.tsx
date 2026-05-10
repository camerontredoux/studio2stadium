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
  useReactTable,
} from "@tanstack/react-table";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
  XIcon,
} from "lucide-react";
import { DancersPagination } from "./dancers-pagination";

type Dancer = ApiSchemas["AdminDancersResponse"]["dancers"][number];
type Pagination = ApiSchemas["AdminDancersResponse"]["pagination"];

type SortBy =
  | "createdAt"
  | "location"
  | "gpa"
  | "gradYear"
  | "username"
  | "firstName"
  | "lastName"
  | "verified"
  | "email";

interface DancersTableProps {
  dancers: Dancer[];
  pagination: Pagination;
  isLoading?: boolean;
}

// Map column IDs to backend sortBy values
const columnToSortBy: Record<string, SortBy> = {
  dancer: "lastName",
  email: "email",
  verified: "verified",
  location: "location",
  gradYear: "gradYear",
  gpa: "gpa",
  createdAt: "createdAt",
};

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
      row.original.location || <span className="text-muted-foreground">-</span>,
  },
  {
    accessorKey: "gradYear",
    header: "Grad Year",
    cell: ({ row }) =>
      row.original.gradYear ?? <span className="text-muted-foreground">-</span>,
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

// Map backend sortBy to column ID for display
const sortByToColumn: Record<string, string> = {
  lastName: "dancer",
  firstName: "dancer",
  username: "dancer",
  email: "email",
  verified: "verified",
  location: "location",
  gradYear: "gradYear",
  gpa: "gpa",
  createdAt: "createdAt",
};

export function DancersTable({
  dancers,
  pagination,
  isLoading,
}: DancersTableProps) {
  const navigate = useNavigate();
  const search = useSearch({ from: "/_admin/(routes)/admin/dancers" });

  const currentSortColumn = search.sortBy
    ? sortByToColumn[search.sortBy]
    : undefined;
  const currentSortDirection = search.sortDirection;

  const handleSort = (columnId: string) => {
    const backendSortBy = columnToSortBy[columnId];
    if (!backendSortBy) return;

    let newDirection: "asc" | "desc" | undefined;

    if (currentSortColumn === columnId) {
      // Cycle: asc -> desc -> none
      if (currentSortDirection === "asc") {
        newDirection = "desc";
      } else if (currentSortDirection === "desc") {
        newDirection = undefined;
      } else {
        newDirection = "asc";
      }
    } else {
      newDirection = "asc";
    }

    navigate({
      to: "/admin/dancers",
      search: {
        ...search,
        page: 0, // Reset to first page when sorting changes
        sortBy: newDirection ? backendSortBy : undefined,
        sortDirection: newDirection,
      },
    });
  };

  const table = useReactTable({
    columns,
    data: dancers,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
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
              {headerGroup.headers.map((header) => {
                const canSort = columnToSortBy[header.id] !== undefined;
                const isSorted = currentSortColumn === header.id;

                return (
                  <TableHead
                    key={header.id}
                    className={columnVisibility[header.id]}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex h-full items-center justify-between gap-2 select-none ${canSort ? "cursor-pointer" : ""}`}
                        onClick={() => canSort && handleSort(header.id)}
                        onKeyDown={(e) => {
                          if (canSort && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault();
                            handleSort(header.id);
                          }
                        }}
                        role={canSort ? "button" : undefined}
                        tabIndex={canSort ? 0 : undefined}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {isSorted && currentSortDirection === "asc" && (
                          <ChevronUpIcon
                            aria-hidden="true"
                            className="size-4 shrink-0 opacity-80"
                          />
                        )}
                        {isSorted && currentSortDirection === "desc" && (
                          <ChevronDownIcon
                            aria-hidden="true"
                            className="size-4 shrink-0 opacity-80"
                          />
                        )}
                      </div>
                    )}
                  </TableHead>
                );
              })}
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
