export const STYLES = {
  "drill-team": "Drill Team",
  "contemporary": "Contemporary",
  "game-day": "Game Day",
  "hip-hop": "Hip Hop",
  "jazz": "Jazz",
  "acro": "Acro",
  "ballet": "Ballet",
  "ballroom": "Ballroom",
  "breakdance": "Breakdance",
  "commercial": "Commercial",
  "kick": "Kick",
  "lyrical": "Lyrical",
  "majorette": "Majorette",
  "military": "Military",
  "open": "Open",
  "other": "Other",
  "pom": "Pom",
  "tap": "Tap",
} as const;

export type StyleCode = keyof typeof STYLES;
export type StyleLabel = (typeof STYLES)[StyleCode];

export const styleOptions = Object.entries(STYLES).map(([value, label]) => ({
  value: value as StyleCode,
  label,
}));

export const styleCodes = Object.keys(STYLES) as [StyleCode, ...StyleCode[]];
