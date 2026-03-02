import type { EventFilter } from "@/features/events/components/filters/types";
import type { DancerFilter } from "@/features/explore/components/dancers/filters/types";
import type { SchoolFilter } from "@/features/explore/components/schools/filters/types";

export type FilterValue = string | string[] | undefined;
export type FilterType =
  | "select"
  | "input"
  | "toggle"
  | "multi-select"
  | "range"
  | "date";
export type Filter = DancerFilter | SchoolFilter | EventFilter;
