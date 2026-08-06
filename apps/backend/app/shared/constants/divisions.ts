export const DIVISIONS = {
  "division-ia": "Division IA",
  "division-i": "Division I",
  "division-ii": "Division II",
  "division-iii": "Division III",
  "naia": "NAIA",
  "njcaa": "NJCAA",
  "community-college": "Community College",
  "other": "Other",
} as const;

export type DivisionCode = keyof typeof DIVISIONS;
export type DivisionLabel = (typeof DIVISIONS)[DivisionCode];

export const divisionOptions = Object.entries(DIVISIONS).map(
  ([value, label]) => ({
    value: value as DivisionCode,
    label,
  })
);

export const divisionCodes = Object.keys(DIVISIONS) as [
  DivisionCode,
  ...DivisionCode[],
];
