import { type ApiSchemas } from "@/lib/api/client";

export type FavoritedDancer = ApiSchemas["SchoolsMeFollowingResponse"][number];
export type FollowedSchool = ApiSchemas["DancersMeFollowingResponse"][number];
export type School = ApiSchemas["SchoolsResponse"][number];
export type Submission =
  ApiSchemas["DancersSubmissionsResponse"]["submissions"][number];
