import type { ApiSchemas } from "@/lib/api/client";

export type PremiumRoadmap = NonNullable<
  ApiSchemas["PremiumRoadmapResponse"]["roadmap"]
>;
export type RoadmapStep = PremiumRoadmap["steps"][number];
export type StepKey = ApiSchemas["StepKey"];
export type StepStatus = ApiSchemas["StepStatus"];
