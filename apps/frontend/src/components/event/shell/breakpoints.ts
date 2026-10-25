/**
 * The dashboard's breakpoints, for the few behaviours CSS can't do (sidebar auto-collapse,
 * phone scroll offsets). They mirror the media queries in src/styles/theme-s2s.css and the
 * bp-* variants; change both together.
 */
export const SHELL_MEDIA = {
  /** Sidebar collapses on its own here (desktop widths at or below 1360px). */
  sidebar: "(max-width: 1360px)",
  /** Phone layout: dock instead of sidebar, stacked widgets. */
  phone: "(max-width: 800px)",
  reducedMotion: "(prefers-reduced-motion: reduce)",
} as const;

export function matches(query: string): boolean {
  return typeof window !== "undefined" && window.matchMedia(query).matches;
}
