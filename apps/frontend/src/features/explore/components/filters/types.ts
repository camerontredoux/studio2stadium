import type { ApiSchemas } from "@/lib/api/client";

export type Filter = ApiSchemas["SchoolsFiltersResponse"][number];
export type FilterParam = Filter["paramKey"];
export type SearchFilter = Partial<Record<FilterParam, string | string[]>>;
