import { differenceInCalendarDays } from "date-fns";
import {
  ClipboardListIcon,
  GraduationCapIcon,
  MegaphoneIcon,
  SchoolIcon,
  TimerIcon,
} from "lucide-react";
import type { TrackerItem, TrackerMilestone } from "./api/mutations";

export type ItemType = TrackerItem["type"];

export const TYPES: Record<
  ItemType,
  { label: string; Icon: typeof SchoolIcon }
> = {
  school: { label: "School", Icon: SchoolIcon },
  clinic: { label: "Clinic", Icon: GraduationCapIcon },
  audition: { label: "Audition", Icon: MegaphoneIcon },
  application: {
    label: "Application milestone",
    Icon: ClipboardListIcon,
  },
  deadline: {
    label: "Recruiting deadline",
    Icon: TimerIcon,
  },
};

// Keep in step with STAGES in apps/backend/app/modules/tracker/stages.ts. An
// item's stage is an index into its type's list; the last stage means done.
export const STAGES: Record<ItemType, string[]> = {
  school: [
    "Interested",
    "Reached out",
    "Visited",
    "Auditioned",
    "Offer",
    "Committed",
  ],
  clinic: ["Planning", "Registered", "Attended"],
  audition: ["Preparing", "Registered", "Auditioned"],
  application: ["Not started", "In progress", "Submitted"],
  deadline: ["Upcoming", "Done"],
};

export const OFFER_STAGE = STAGES.school.indexOf("Offer");

// A dancer commits to one school at most; the API rejects a second.
export const COMMITTED = STAGES.school.length - 1;

export const findCommitted = <T extends Pick<TrackerItem, "type" | "stage">>(
  items: T[],
) => items.find((i) => i.type === "school" && i.stage === COMMITTED);

// Section key for items with no school. The API calls this section `null`.
export const OTHER = "other";

export function sectionOf(item: Pick<TrackerItem, "school">) {
  return item.school?.id ?? OTHER;
}

export function formatDate(date: string | null) {
  if (!date) return "No date";
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function isDone(item: Pick<TrackerItem, "type" | "stage">) {
  return item.stage === STAGES[item.type].length - 1;
}

export function daysUntil(date: string) {
  return differenceInCalendarDays(new Date(`${date}T12:00:00`), new Date());
}

// Soonest open date first, then undated, then finished items.
export function byUrgency(a: TrackerItem, b: TrackerItem) {
  const rank = (i: TrackerItem) => (isDone(i) ? 2 : i.date ? 0 : 1);
  return (
    rank(a) - rank(b) ||
    (a.date ?? "").localeCompare(b.date ?? "") ||
    a.id.localeCompare(b.id)
  );
}

// Whether a school's milestones are all reached. A school with none hasn't
// reached anything yet.
export function reachedAll(
  milestones: Pick<TrackerMilestone, "completedAt">[],
) {
  return milestones.length > 0 && milestones.every((m) => m.completedAt);
}
