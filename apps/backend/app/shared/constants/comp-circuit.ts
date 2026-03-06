export const COMPETITIVE_CIRCUITS = {
  "uda": "UDA",
  "dtu": "DTU",
  "nda": "NDA",
  "usa": "USA",
  "non-competitive": "Non-Competitive",
  "other": "Other",
} as const;

export type CompetitiveCircuitCode = keyof typeof COMPETITIVE_CIRCUITS;
export type CompetitiveCircuitLabel =
  (typeof COMPETITIVE_CIRCUITS)[CompetitiveCircuitCode];

export const competitiveCircuitOptions = Object.entries(
  COMPETITIVE_CIRCUITS
).map(([value, label]) => ({
  value: value as CompetitiveCircuitCode,
  label,
}));

export const competitiveCircuitCodes = Object.keys(COMPETITIVE_CIRCUITS) as [
  CompetitiveCircuitCode,
  ...CompetitiveCircuitCode[],
];
