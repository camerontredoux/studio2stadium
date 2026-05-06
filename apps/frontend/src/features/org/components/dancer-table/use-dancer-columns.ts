import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  bibColumn,
  nameColumn,
  gradYearColumn,
  studioColumn,
  gpaColumn,
  favoriteToggleColumn,
  notesIndicatorColumn,
  schoolInterestColumn,
  ratingDisplayColumn,
  rankColumn,
  notePreviewColumn,
  selectColumn,
  ratingQuickActionColumn,
  notesQuickActionColumn,
  type SearchDancerRow,
  type FavoriteDancerRow,
  type RankedDancerRow,
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
      cols.push(notesQuickActionColumn(opts.onOpenNotes));
    } else {
      cols.push(notesIndicatorColumn as ColumnDef<SearchDancerRow>);
    }

    cols.push(schoolInterestColumn);

    return cols;
  }, [onFavoriteToggle, opts?.enableSelection, opts?.onRate, opts?.onOpenNotes]);
}

export function useFavoritesColumns(): ColumnDef<FavoriteDancerRow>[] {
  return useMemo(
    () => [
      bibColumn as ColumnDef<FavoriteDancerRow>,
      nameColumn as ColumnDef<FavoriteDancerRow>,
      gradYearColumn as ColumnDef<FavoriteDancerRow>,
      studioColumn as ColumnDef<FavoriteDancerRow>,
      gpaColumn as ColumnDef<FavoriteDancerRow>,
      ratingDisplayColumn() as ColumnDef<FavoriteDancerRow>,
      notesIndicatorColumn as ColumnDef<FavoriteDancerRow>,
    ],
    [],
  );
}

export function useRankingsColumns(): ColumnDef<RankedDancerRow>[] {
  return useMemo(
    () => [
      rankColumn,
      bibColumn as ColumnDef<RankedDancerRow>,
      nameColumn as ColumnDef<RankedDancerRow>,
      gradYearColumn as ColumnDef<RankedDancerRow>,
      gpaColumn as ColumnDef<RankedDancerRow>,
      ratingDisplayColumn() as ColumnDef<RankedDancerRow>,
      notePreviewColumn,
    ],
    [],
  );
}
