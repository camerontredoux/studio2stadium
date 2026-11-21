import { sportOptions } from "#shared/constants/sports";
import { stateOptions } from "#shared/constants/states";
import { styleOptions } from "#shared/constants/styles";

type DancerFilterParam =
  | "name"
  | "premium"
  | "gpaRange"
  | "gradYear"
  | "location"
  | "sports"
  | "styles"
  | "following";

export type Filter = {
  label: string;
  id: string;
  type: "input" | "select" | "toggle" | "multi-select" | "range";
  paramKey: DancerFilterParam;
  options?: { label: string; value: string }[];
};

/**
 * Class of YYYY choices, from last year's graduates through incoming high
 * school freshmen. The empty value is "All years": selecting it clears the
 * filter, and the dancers endpoint treats an empty gradYear as no filter.
 */
export function gradYearOptions(now = new Date()) {
  const current = now.getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => String(current - 1 + i));
  return [
    { label: "All years", value: "" },
    ...years.map((year) => ({ label: `Class of ${year}`, value: year })),
  ];
}

export const dancerFilters = (now = new Date()): Filter[] => [
  {
    label: "Dancer Name",
    id: "dancer-name",
    type: "input",
    paramKey: "name",
  },
  {
    label: "Following",
    id: "following",
    type: "toggle",
    paramKey: "following",
  },
  {
    label: "Premium",
    id: "premium",
    type: "toggle",
    paramKey: "premium",
  },
  {
    label: "GPA Range",
    id: "gpa-range",
    type: "range",
    paramKey: "gpaRange",
  },
  {
    label: "Graduation Year",
    id: "grad-year",
    type: "select",
    paramKey: "gradYear",
    options: gradYearOptions(now),
  },
  {
    label: "Location",
    id: "location",
    type: "select",
    paramKey: "location",
    options: stateOptions,
  },
  {
    label: "Sports",
    id: "sports",
    type: "multi-select",
    paramKey: "sports",
    options: sportOptions,
  },
  {
    label: "Styles",
    id: "styles",
    type: "multi-select",
    paramKey: "styles",
    options: styleOptions,
  },
];
