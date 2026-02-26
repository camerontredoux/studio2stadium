import { type ApiSchemas } from "@/lib/api/client";

export type DancerProfile = ApiSchemas["DancersIdResponse"];
export type Reference = ApiSchemas["DancersIdResponse"]["references"][number];
export type Achievement =
  ApiSchemas["DancersIdResponse"]["achievements"][number];
