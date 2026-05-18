import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  bibColumn,
  nameWithProfileColumn,
  gradYearColumn,
  studioColumn,
  gpaColumn,
  favoriteToggleColumn,
  callbackToggleColumn,
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
    onCallbackToggle?: (rosterId: string, current: boolean) => void;
    showRank?: boolean;
  },
): ColumnDef<SearchDancerRow>[] {
  return useMemo(() => {
    const cols: ColumnDef<SearchDancerRow>[] = [];

    if (opts?.enableSelection) {
      cols.push(selectColumn<SearchDancerRow>());
    }

    if (opts?.showRank) {
      cols.push(rankColumn<SearchDancerRow>());
    }

    cols.push(
      bibColumn as ColumnDef<SearchDancerRow>,
      nameWithProfileColumn(),
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

    if (opts?.onCallbackToggle) {
      cols.push(callbackToggleColumn(opts.onCallbackToggle));
    }

    if (opts?.onOpenNotes) {
      cols.push(notesQuickActionColumn(opts.onOpenNotes) as ColumnDef<SearchDancerRow>);
    }

    cols.push(schoolInterestColumn);

    return cols;
  }, [onFavoriteToggle, opts?.enableSelection, opts?.onRate, opts?.onOpenNotes, opts?.onCallbackToggle, opts?.showRank]);
}
