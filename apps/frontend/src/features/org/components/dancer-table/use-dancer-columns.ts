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
  type SearchDancerRow,
  type FavoriteDancerRow,
  type RankedDancerRow,
} from "./columns";

export function useSearchColumns(
  onFavoriteToggle: (rosterId: string, current: boolean) => void,
): ColumnDef<SearchDancerRow>[] {
  return useMemo(
    () => [
      bibColumn as ColumnDef<SearchDancerRow>,
      nameColumn as ColumnDef<SearchDancerRow>,
      gradYearColumn as ColumnDef<SearchDancerRow>,
      studioColumn as ColumnDef<SearchDancerRow>,
      gpaColumn as ColumnDef<SearchDancerRow>,
      favoriteToggleColumn(onFavoriteToggle),
      notesIndicatorColumn as ColumnDef<SearchDancerRow>,
      schoolInterestColumn,
    ],
    [onFavoriteToggle],
  );
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
