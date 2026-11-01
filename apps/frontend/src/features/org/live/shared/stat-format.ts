/** Padding for a stats section's body, under its head. */
export const sectionBody = "px-(--space-14) pt-(--space-12) pb-(--space-14)";

/** A count, or a dash while it loads. */
export function statCount(value: number | undefined, pending: boolean) {
  return pending || value === undefined ? "—" : value.toLocaleString();
}
