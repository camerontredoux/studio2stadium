import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Frame, FrameFooter } from "@/components/ui/frame";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Rating, RatingItem } from "@/components/ui/rating";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast-manager";
import { formatDate } from "@/components/utils/format";
import type { ApiSchemas } from "@/lib/api/client";
import { dateToRelativeTime } from "@/utils/date";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
  Loader2Icon,
} from "lucide-react";
import { useState } from "react";
import { useUpdateFavorite } from "../api/mutations";
import { favoritesQueries } from "../api/queries";

type Favorite = ApiSchemas["SchoolsMeFavoritesResponse"][number];

const getStatusColor = (rating: Favorite["rating"]) => {
  if (!rating) return "text-muted-foreground/64";

  if (rating === 5) {
    return "text-emerald-500";
  } else if (rating >= 2 && rating <= 4) {
    return "text-amber-500";
  } else {
    return "text-red-500";
  }
};

function FavoriteCard({
  favorite,
  onClick,
}: {
  favorite: Favorite;
  onClick: () => void;
}) {
  return (
    <Card
      className="hover:bg-muted/50 cursor-pointer py-3 transition-colors"
      onClick={onClick}
    >
      <CardHeader className="gap-2 pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Avatar className="size-9">
              <AvatarImage src={favorite.avatar ?? undefined} />
              <AvatarFallback>
                {favorite.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              {favorite.name}
              <Link
                to={"/$username"}
                params={{ username: favorite.username }}
                className="text-muted-foreground flex items-center gap-1 text-sm hover:underline"
              >
                {favorite.username}{" "}
                <ExternalLinkIcon className="size-3 shrink-0" />
              </Link>
            </div>
          </CardTitle>
          <CardDescription title={formatDate(favorite.createdAt)}>
            {dateToRelativeTime(favorite.createdAt)}
          </CardDescription>
        </div>
        <Rating disabled size="sm" value={favorite.rating ?? 0}>
          {Array.from({ length: 5 }, (_, i) => (
            <RatingItem
              className={getStatusColor(favorite.rating)}
              key={i}
              index={i}
            />
          ))}
        </Rating>
      </CardHeader>
      <CardPanel className="pt-0">
        <p className="text-sm">
          {favorite.comment || (
            <span className="text-muted-foreground text-sm">
              Leave a comment...
            </span>
          )}
        </p>
      </CardPanel>
    </Card>
  );
}

const columns: ColumnDef<Favorite>[] = [
  {
    accessorKey: "username",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Avatar>
          <AvatarImage src={row.original.avatar ?? undefined} />
          <AvatarFallback>
            {row.original.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="truncate font-medium">{row.original.name}</span>
          <Link
            to={"/$username"}
            params={{ username: row.original.username }}
            className="text-muted-foreground flex items-center gap-1 truncate text-sm hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.original.username}
            <ExternalLinkIcon className="size-3 shrink-0" />
          </Link>
        </div>
      </div>
    ),
    header: "Dancer",
  },
  {
    accessorKey: "rating",
    cell: ({ row }) => {
      const rating = row.getValue("rating") as Favorite["rating"];
      return (
        <Rating disabled size="sm" value={rating ?? 0}>
          {Array.from({ length: 5 }, (_, i) => (
            <RatingItem className={getStatusColor(rating)} key={i} index={i} />
          ))}
        </Rating>
      );
    },
    header: "Rating",
  },
  {
    accessorKey: "comment",
    cell: ({ row }) => (
      <div className="font-medium">
        {row.getValue("comment") || (
          <span className="text-muted-foreground text-sm">
            Leave a comment...
          </span>
        )}
      </div>
    ),
    header: "Comment",
  },
  {
    accessorKey: "createdAt",
    header: "Favorited",
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as Favorite["createdAt"];
      return (
        <div
          title={formatDate(createdAt)}
          className="text-muted-foreground text-sm"
        >
          {dateToRelativeTime(createdAt, { strict: true })}
        </div>
      );
    },
  },
];

export function FavoritesTable() {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery(favoritesQueries.favorites());
  const { mutate: updateFavorite, isPending: isUpdating } = useUpdateFavorite();

  const pageSize = 10;

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize,
  });

  const [sorting, setSorting] = useState<SortingState>([
    {
      desc: true,
      id: "rating",
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFavorite, setSelectedFavorite] = useState<Favorite | null>(
    null,
  );
  const [editRating, setEditRating] = useState<number>(0);
  const [editComment, setEditComment] = useState<string>("");

  const handleRowClick = (favorite: Favorite) => {
    setSelectedFavorite(favorite);
    setEditRating(favorite.rating ?? 0);
    setEditComment(favorite.comment ?? "");
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedFavorite) return;

    const newRating = editRating || null;
    const newComment = editComment || null;

    updateFavorite(
      {
        params: { path: { id: selectedFavorite.id } },
        body: {
          rating: newRating,
          comment: newComment,
        },
      },
      {
        onSuccess: () => {
          // Update cache directly to avoid refetching
          queryClient.setQueryData(
            favoritesQueries.favorites().queryKey,
            (old: Favorite[] | undefined) =>
              old?.map((f) =>
                f.id === selectedFavorite.id
                  ? { ...f, rating: newRating, comment: newComment }
                  : f,
              ),
          );
          toastManager.add({
            title: "Success",
            description: "Favorite updated",
            type: "success",
          });
          setDialogOpen(false);
        },
      },
    );
  };

  const table = useReactTable({
    columns,
    data: data ?? [],
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    state: {
      pagination,
      sorting,
    },
  });

  const paginatedData = table.getRowModel().rows.map((row) => row.original);

  return (
    <>
      {/* Mobile Card View */}
      <div className="flex flex-col gap-3 sm:hidden">
        {isPending ? (
          <div className="flex h-24 items-center justify-center gap-2">
            <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
            <p className="text-muted-foreground text-sm">
              Loading favorites...
            </p>
          </div>
        ) : paginatedData.length ? (
          <>
            {paginatedData.map((favorite) => (
              <FavoriteCard
                key={favorite.id}
                favorite={favorite}
                onClick={() => handleRowClick(favorite)}
              />
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
          <div className="flex h-24 items-center justify-center">
            <p className="text-muted-foreground text-sm">No results.</p>
          </div>
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
            {isPending ? (
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
                    <p className="text-muted-foreground text-sm">
                      Loading favorites...
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  className="cursor-pointer"
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  key={row.id}
                  onClick={() => handleRowClick(row.original)}
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
                  No results.
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Favorite</DialogTitle>
            <DialogDescription>
              Update the rating and comment for {selectedFavorite?.username}.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <div className="flex flex-col gap-4">
              <Field>
                <FieldLabel>Rating</FieldLabel>
                <Rating value={editRating} onValueChange={setEditRating}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <RatingItem
                      className={getStatusColor(editRating)}
                      key={i}
                      index={i}
                    />
                  ))}
                </Rating>
              </Field>
              <Field>
                <FieldLabel>Comment</FieldLabel>
                <Textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  placeholder="Add a comment..."
                />
              </Field>
            </div>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="secondary" />}>
              Cancel
            </DialogClose>
            <Button onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? <Spinner label="Saving..." /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
