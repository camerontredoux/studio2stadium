import { sportOptions } from "#shared/constants/sports";
import { stateOptions } from "#shared/constants/states";
import { styleOptions } from "#shared/constants/styles";

type DancerFilterParam =
  | "name"
  | "premium"
  | "gpaRange"
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

export const filters: Filter[] = [
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
