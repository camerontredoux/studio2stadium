import { stateOptions } from "#shared/constants/states";

type EventFilterParam = "schoolName" | "location" | "date";

export type EventFilter = {
  label: string;
  id: string;
  type: "input" | "select" | "toggle" | "multi-select" | "range" | "date";
  paramKey: EventFilterParam;
  options?: { label: string; value: string }[];
};

export const eventFilters: EventFilter[] = [
  {
    label: "School Name",
    id: "school-name",
    type: "input",
    paramKey: "schoolName",
  },
  {
    label: "Location",
    id: "location",
    type: "select",
    paramKey: "location",
    options: stateOptions,
  },
  {
    label: "Date",
    id: "date",
    type: "date",
    paramKey: "date",
  },
];
