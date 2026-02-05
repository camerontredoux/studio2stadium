export const SPORTS = {
  "football": "Football",
  "basketball": "Basketball",
  "volleyball": "Volleyball",
  "soccer": "Soccer",
  "baseball": "Baseball",
  "gymnastics": "Gymnastics",
  "swim": "Swim",
  "tennis": "Tennis",
  "hockey": "Hockey",
  "lacrosse": "Lacrosse",
  "golf": "Golf",
  "skiing": "Skiing",
  "wrestling": "Wrestling",
  "water-polo": "Water Polo",
  "track-and-field": "Track and Field",
  "softball": "Softball",
  "rowing": "Rowing",
  "other": "Other",
} as const;

export type SportCode = keyof typeof SPORTS;
export type SportLabel = (typeof SPORTS)[SportCode];

export const sportOptions = Object.entries(SPORTS).map(([value, label]) => ({
  value: value as SportCode,
  label,
}));

export const sportCodes = Object.keys(SPORTS) as [SportCode, ...SportCode[]];
