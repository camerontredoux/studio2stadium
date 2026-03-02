import type { ApiSchemas } from "@/lib/api/client";

export type EventFilter = ApiSchemas["EventsFiltersResponse"][number];
export type EventFilterParam = EventFilter["paramKey"];
export type EventSearchFilter = Partial<
  Record<EventFilterParam, string | string[]>
>;
