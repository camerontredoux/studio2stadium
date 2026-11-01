import type { OrgEvent } from "@/features/org/api/admin-queries";

/**
 * Whether the admin home should ask the Organizer to activate the event on
 * screen: it is not active, and neither is any other event of the Org. A
 * bought Org Event starts inactive (#88), so this is the first thing its buyer
 * sees. With another event active, the event switcher's "Make active" is
 * enough — nothing is missing for dancers and coaches.
 */
export function needsActivationPrompt(
  event: Pick<OrgEvent, "isActive">,
  activeEvent: Pick<OrgEvent, "id"> | null,
): boolean {
  return !event.isActive && activeEvent === null;
}
