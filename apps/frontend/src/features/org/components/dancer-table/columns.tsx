import type { ColumnDef } from "@tanstack/react-table";
import { Heart, PencilIcon, StarIcon } from "lucide-react";
import { Rating, RatingItem } from "@/components/ui/rating";

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
    header: () => <Heart className="text-muted-foreground size-4" title="Favorite" />,
    size: 40,
    enableSorting: false,
    cell: ({ row }) => (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(row.original.rosterId, row.original.isFavorited);
        }}
        className="flex items-center justify-center"
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
  header: () => <PencilIcon className="size-3.5 text-muted-foreground" title="Notes" />,
  size: 40,
  enableSorting: false,
  cell: ({ row }) => {
    const has =
      (row.original as { hasNote?: boolean }).hasNote ??
      (row.original as { hasNotes?: boolean }).hasNotes ??
      (row.original as { note?: string | null }).note != null;
    return has ? (
      <span className="bg-primary inline-block size-2 rounded-full" />
    ) : null;
  },
};

export const schoolInterestColumn: ColumnDef<SearchDancerRow> = {
  id: "schoolInterest",
  header: () => <StarIcon className="size-3.5 text-muted-foreground" title="Interested in your school" />,
  size: 40,
  enableSorting: false,
  cell: ({ row }) =>
    row.original.interestedInMySchool ? (
      <span className="text-amber-500">{"★"}</span>
    ) : null,
};

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
