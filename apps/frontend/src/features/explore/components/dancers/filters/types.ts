import type { ApiSchemas } from "@/lib/api/client";

export type DancerFilter = ApiSchemas["DancersFiltersResponse"][number];
export type DancerFilterParam = DancerFilter["paramKey"];
export type DancerSearchFilter = Partial<
  Record<DancerFilterParam, string | string[]>
>;
