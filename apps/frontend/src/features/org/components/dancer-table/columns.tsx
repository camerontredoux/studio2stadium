import type { ColumnDef } from "@tanstack/react-table";
import { CheckIcon, Heart, PencilIcon, StarIcon } from "lucide-react";
import { Rating, RatingItem } from "@/components/ui/rating";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/components/utils/cn";

export interface DancerRow {
  rosterId: string;
  bibNumber: number | null;
  firstName: string;
  lastName: string;
  gradYear: number | null;
  studio: string | null;
  gpa: number | null;
  profilePhotoUrl: string | null;
  state: string | null;
}

export interface SearchDancerRow extends DancerRow {
  interestedInMySchool: boolean;
  isFavorited: boolean;
  hasNote: boolean;
  rating: number | null;
}

export interface FavoriteDancerRow extends DancerRow {
  rating: number | null;
  hasNotes: boolean;
}

export interface RankedDancerRow extends DancerRow {
  rating: number | null;
  note: string | null;
  isFavorited: boolean;
}

export const bibColumn: ColumnDef<DancerRow> = {
  accessorKey: "bibNumber",
  header: "Bib",
  size: 60,
  cell: ({ getValue }) => {
    const bib = getValue<number | null>();
    return (
      <span className="font-mono text-sm">
        {bib != null ? String(bib).padStart(2, "0") : "—"}
      </span>
    );
  },
};

export const nameColumn: ColumnDef<DancerRow> = {
  id: "name",
  accessorFn: (row) => `${row.lastName}, ${row.firstName}`,
  header: "Name",
  cell: ({ row }) => (
    <span className="truncate font-medium">
      {row.original.lastName}, {row.original.firstName}
    </span>
  ),
};

export const gradYearColumn: ColumnDef<DancerRow> = {
  accessorKey: "gradYear",
  header: "Year",
  size: 70,
  cell: ({ getValue }) => getValue<number | null>() ?? "—",
};

export const studioColumn: ColumnDef<DancerRow> = {
  accessorKey: "studio",
  header: "Studio",
  enableSorting: false,
  cell: ({ getValue }) => (
    <span className="truncate">{getValue<string | null>() ?? "—"}</span>
  ),
};

export const gpaColumn: ColumnDef<DancerRow> = {
  accessorKey: "gpa",
  header: "GPA",
  size: 60,
  cell: ({ getValue }) => {
    const gpa = getValue<number | null>();
    return gpa != null ? gpa.toFixed(1) : "—";
  },
};

export function favoriteToggleColumn(
  onToggle: (rosterId: string, current: boolean) => void,
): ColumnDef<SearchDancerRow> {
  return {
    id: "favorite",
    header: () => <span title="Favorite"><Heart className="text-muted-foreground size-4" /></span>,
    size: 40,
    enableSorting: false,
    cell: ({ row }) => (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(row.original.rosterId, row.original.isFavorited);
        }}
        className="flex cursor-pointer items-center justify-center"
        aria-label={
          row.original.isFavorited ? "Unfavorite" : "Favorite"
        }
      >
        <Heart
          className={`size-4 ${
            row.original.isFavorited
              ? "fill-current text-red-500"
              : "text-muted-foreground"
          }`}
        />
      </button>
    ),
  };
}

export const notesIndicatorColumn: ColumnDef<{
  hasNotes?: boolean;
  hasNote?: boolean;
  note?: string | null;
}> = {
  id: "notes",
  header: () => <span title="Notes"><PencilIcon className="size-3.5 text-muted-foreground" /></span>,
  size: 40,
  enableSorting: false,
  cell: ({ row }) => {
    const has =
      (row.original as { hasNote?: boolean }).hasNote ??
      (row.original as { hasNotes?: boolean }).hasNotes ??
      (row.original as { note?: string | null }).note != null;
    return has ? (
      <Tooltip delay={0}>
        <TooltipTrigger render={<span />}>
          <CheckIcon className="text-primary size-3.5" />
        </TooltipTrigger>
        <TooltipPopup>You have notes for this dancer</TooltipPopup>
      </Tooltip>
    ) : null;
  },
};

export const schoolInterestColumn: ColumnDef<SearchDancerRow> = {
  id: "schoolInterest",
  header: () => <span title="Interested in your school"><StarIcon className="size-3.5 text-muted-foreground" /></span>,
  size: 40,
  enableSorting: false,
  cell: ({ row }) =>
    row.original.interestedInMySchool ? (
      <span className="text-amber-500">{"★"}</span>
    ) : null,
};

export function selectColumn<T>(): ColumnDef<T> {
  return {
    id: "select",
    size: 40,
    enableSorting: false,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={(checked) =>
          table.toggleAllPageRowsSelected(!!checked)
        }
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(!!checked)}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        aria-label="Select row"
      />
    ),
  };
}

export function ratingQuickActionColumn(
  onRate: (rosterId: string, rating: number) => void,
): ColumnDef<SearchDancerRow> {
  return {
    accessorKey: "rating",
    header: "Rating",
    size: 120,
    cell: ({ row }) => {
      const rating = row.original.rating;
      return (
        <div
          className="flex items-center"
          onClick={(e) => e.stopPropagation()}
        >
          {rating == null && (
            <span className="text-muted-foreground text-sm group-hover/row:hidden group-focus-within/row:hidden">
              —
            </span>
          )}
          <Rating
            size="sm"
            value={rating ?? 0}
            onValueChange={(v) => onRate(row.original.rosterId, v)}
            className={cn(
              "transition-opacity",
              rating == null
                ? "hidden group-hover/row:flex group-focus-within/row:flex"
                : "pointer-events-none group-hover/row:pointer-events-auto group-focus-within/row:pointer-events-auto",
            )}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <RatingItem key={i} index={i} />
            ))}
          </Rating>
        </div>
      );
    },
  };
}

export function notesQuickActionColumn(
  onOpenNotes: (rosterId: string) => void,
): ColumnDef<SearchDancerRow> {
  return {
    id: "notes",
    header: () => (
      <span title="Notes">
        <PencilIcon className="text-muted-foreground size-3.5" />
      </span>
    ),
    size: 40,
    enableSorting: false,
    cell: ({ row }) => {
      const hasNote = row.original.hasNote;
      return (
        <div className="flex items-center justify-center">
          {hasNote && (
            <span className="bg-primary inline-block size-2 rounded-full group-hover/row:hidden group-focus-within/row:hidden" />
          )}
          <button
            type="button"
            className="hidden items-center justify-center group-hover/row:flex group-focus-within/row:flex"
            onClick={(e) => {
              e.stopPropagation();
              onOpenNotes(row.original.rosterId);
            }}
            aria-label="Edit notes"
          >
            <PencilIcon className="text-muted-foreground hover:text-foreground size-3.5 transition-colors" />
          </button>
        </div>
      );
    },
  };
}

export function ratingDisplayColumn(): ColumnDef<{ rating: number | null }> {
  return {
    accessorKey: "rating",
    header: "Rating",
    size: 120,
    cell: ({ getValue }) => {
      const rating = getValue<number | null>();
      if (rating == null)
        return <span className="text-muted-foreground text-sm">{"—"}</span>;
      return (
        <Rating disabled size="sm" value={rating}>
          {Array.from({ length: 5 }, (_, i) => (
            <RatingItem key={i} index={i} />
          ))}
        </Rating>
      );
    },
  };
}

export const rankColumn: ColumnDef<RankedDancerRow> = {
  id: "rank",
  header: "#",
  size: 40,
  enableSorting: false,
  cell: ({ row }) => (
    <span className="text-muted-foreground font-mono text-sm">
      {row.index + 1}
    </span>
  ),
};

export const notePreviewColumn: ColumnDef<RankedDancerRow> = {
  id: "notePreview",
  header: "Note",
  enableSorting: false,
  cell: ({ row }) =>
    row.original.note ? (
      <span className="text-muted-foreground line-clamp-1 text-sm">
        {row.original.note}
      </span>
    ) : null,
};
