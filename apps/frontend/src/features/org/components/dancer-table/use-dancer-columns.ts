import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  bibColumn,
  nameColumn,
  gradYearColumn,
  studioColumn,
  gpaColumn,
  favoriteToggleColumn,
  notesQuickActionColumn,
  schoolInterestColumn,
  rankColumn,
  selectColumn,
  ratingQuickActionColumn,
  ratingDisplayColumn,
  type SearchDancerRow,
} from "./columns";

export function useSearchColumns(
  onFavoriteToggle: (rosterId: string, current: boolean) => void,
  opts?: {
    enableSelection?: boolean;
    onRate?: (rosterId: string, rating: number) => void;
    onOpenNotes?: (rosterId: string) => void;
  },
): ColumnDef<SearchDancerRow>[] {
  return useMemo(() => {
    const cols: ColumnDef<SearchDancerRow>[] = [];

    if (opts?.enableSelection) {
      cols.push(selectColumn<SearchDancerRow>());
    }

    cols.push(
      bibColumn as ColumnDef<SearchDancerRow>,
      nameColumn as ColumnDef<SearchDancerRow>,
      gradYearColumn as ColumnDef<SearchDancerRow>,
      studioColumn as ColumnDef<SearchDancerRow>,
      gpaColumn as ColumnDef<SearchDancerRow>,
    );

    if (opts?.onRate) {
      cols.push(ratingQuickActionColumn(opts.onRate));
    } else {
      cols.push(ratingDisplayColumn() as ColumnDef<SearchDancerRow>);
    }

    cols.push(favoriteToggleColumn(onFavoriteToggle));

    if (opts?.onOpenNotes) {
      cols.push(notesQuickActionColumn(opts.onOpenNotes) as ColumnDef<SearchDancerRow>);
    }

    cols.push(schoolInterestColumn);

    return cols;
  }, [onFavoriteToggle, opts?.enableSelection, opts?.onRate, opts?.onOpenNotes]);
}
