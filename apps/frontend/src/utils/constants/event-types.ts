export const EVENT_TYPES = [
  "recruitment",
  "audition",
  "other",
  "rehearsal",
  "recital",
  "showcase",
  "competition",
  "class",
  "intensive",
  "workshop",
  "fundraiser",
  "combine",
  "convention",
  "clinic",
  "deadline",
  "performance",
  "camp",
] as const;

export const EVENT_TYPE_LABELS: Record<(typeof EVENT_TYPES)[number], string> = {
  recruitment: "Recruitment",
  audition: "Audition",
  other: "Other",
  rehearsal: "Rehearsal",
  recital: "Recital",
  showcase: "Showcase",
  competition: "Competition",
  class: "Class",
  intensive: "Intensive",
  workshop: "Workshop",
  fundraiser: "Fundraiser",
  combine: "Combine",
  convention: "Convention",
  clinic: "Clinic",
  deadline: "Deadline",
  performance: "Performance",
  camp: "Camp",
};

export const EVENT_TYPE_ITEMS = EVENT_TYPES.map((type) => ({
  value: type,
  label: EVENT_TYPE_LABELS[type],
}));
