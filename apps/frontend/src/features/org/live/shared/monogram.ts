/** Up to three initials for the sidebar monogram ("Summit Dance Org" → "SDO"). */
export function monogram(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  const letters =
    words.length > 1 ? words.map((word) => word[0]).join("") : name;
  return letters.slice(0, 3).toUpperCase();
}
