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
