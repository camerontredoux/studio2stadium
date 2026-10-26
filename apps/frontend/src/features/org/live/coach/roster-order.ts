import type { ScoutedDancer } from "./coach-scouting";

export type RosterSortKey =
  | "bib"
  | "name"
  | "year"
  | "studio"
  | "gpa"
  | "rating";
export type RosterSort = { key: RosterSortKey; dir: "asc" | "desc" };

/** Rating and GPA start high-to-low; the rest low-to-high. */
export function nextSort(current: RosterSort, key: RosterSortKey): RosterSort {
  if (current.key === key) {
    return { key, dir: current.dir === "asc" ? "desc" : "asc" };
  }
  return { key, dir: key === "rating" || key === "gpa" ? "desc" : "asc" };
}

/** Rated dancers, best first: rating, then favourites, then bib (as the mockup sorts). */
export function rankDancers(dancers: ScoutedDancer[]) {
  return dancers
    .filter((dancer) => (dancer.rating ?? 0) > 0)
    .sort(
      (a, b) =>
        (b.rating ?? 0) - (a.rating ?? 0) ||
        Number(b.isFavorited) - Number(a.isFavorited) ||
        (a.bibNumber ?? Infinity) - (b.bibNumber ?? Infinity),
    );
}
