/**
 * GPA buckets, lowest first: at least `gpaMin`, under `gpaBelow`. The keys are
 * not whole numbers so the object keeps this order, and they match the keys of
 * the talent pool's GPA bands from the dancer summary.
 */
export const GPA_RANGES: Record<
  string,
  { label: string; gpaMin?: number; gpaBelow?: number }
> = {
  "under-2.5": { label: "Under 2.5", gpaBelow: 2.5 },
  "2.5-3.0": { label: "2.5-3.0", gpaMin: 2.5, gpaBelow: 3 },
  "3.0-3.5": { label: "3.0-3.5", gpaMin: 3, gpaBelow: 3.5 },
  "3.5-4.0": { label: "3.5-4.0", gpaMin: 3.5, gpaBelow: 4 },
  "4.0+": { label: "4.0+", gpaMin: 4 },
};
