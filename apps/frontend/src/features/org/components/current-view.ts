export type View = "Admin" | "Coach" | "Dancer";

/**
 * The view a path belongs to. The area is the segment right after the org
 * slug (`/o/{orgSlug}/{area}/...`), so a dancer page such as `/dancer/coaches`
 * or an org slug such as `coach-academy` is never read as another view.
 */
export function viewForPathname(pathname: string): View {
  const area = pathname.split("/").filter(Boolean)[2];
  if (area === "admin") return "Admin";
  if (area === "coach") return "Coach";
  return "Dancer";
}
