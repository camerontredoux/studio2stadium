import { type ApiSchemas } from "@/lib/api/client";

export type FavoritedDancer = ApiSchemas["SchoolsMeFollowingResponse"][number];
export type FollowedSchool = ApiSchemas["DancersMeFollowingResponse"][number];
