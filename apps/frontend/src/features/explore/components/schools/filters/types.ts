import type { ApiSchemas } from "@/lib/api/client";

export type SchoolFilter = ApiSchemas["SchoolsFiltersResponse"][number];
export type SchoolFilterParam = SchoolFilter["paramKey"];
export type SchoolSearchFilter = Partial<
  Record<SchoolFilterParam, string | string[]>
>;
