import type { ApiSchemas } from "@/lib/api/client";

export type RecommendedSchool =
  ApiSchemas["SchoolsRecommendedResponse"][number];

export type RecommendedDancer =
  ApiSchemas["DancersRecommendedResponse"][number];

export type PrioritySpotlightDancer =
  ApiSchemas["DancersPriorityspotlightsResponse"][number];
