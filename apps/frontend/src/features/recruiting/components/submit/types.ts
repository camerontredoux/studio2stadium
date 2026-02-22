import type { ApiSchemas } from "@/lib/api/client";

export type Step = "video" | "schools" | "confirm";

export type School = ApiSchemas["DancersSubmissionsSchoolsResponse"][number];

export interface SubmitFormState {
  videoUrl: string;
  selectedSchools: Set<string>;
}
