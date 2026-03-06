export const TEAM_SELECTION = {
  recruitment: "Recruitment",
  audition: "Audition",
  hybrid: "Hybrid",
} as const;

export type TeamSelectionCode = keyof typeof TEAM_SELECTION;
export type TeamSelectionLabel = (typeof TEAM_SELECTION)[TeamSelectionCode];

export const teamSelectionOptions = Object.entries(TEAM_SELECTION).map(
  ([value, label]) => ({
    value: value as TeamSelectionCode,
    label,
  })
);

export const teamSelectionCodes = Object.keys(TEAM_SELECTION) as [
  TeamSelectionCode,
  ...TeamSelectionCode[],
];
