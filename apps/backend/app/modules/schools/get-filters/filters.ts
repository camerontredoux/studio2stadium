import { divisionOptions } from "#shared/constants/divisions";
import { sportOptions } from "#shared/constants/sports";
import { stateOptions } from "#shared/constants/states";
import { styleOptions } from "#shared/constants/styles";

type SchoolFilterParam =
  | "name"
  | "commonRecruiting"
  | "upcomingEvents"
  | "gpaRange"
  | "location"
  | "division"
  | "sports"
  | "styles"
  | "following";

export type Filter = {
  label: string;
  id: string;
  type: "input" | "select" | "toggle" | "multi-select" | "range";
  paramKey: SchoolFilterParam;
  options?: { label: string; value: string }[];
};

export const filters: Filter[] = [
  {
    label: "School Name",
    id: "school-name",
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
    label: "Common Recruiting",
    id: "common-recruiting-application",
    type: "toggle",
    paramKey: "commonRecruiting",
  },
  {
    label: "Upcoming Events",
    id: "upcoming-events",
    type: "toggle",
    paramKey: "upcomingEvents",
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
    label: "Division",
    id: "division",
    type: "multi-select",
    paramKey: "division",
    options: divisionOptions,
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
