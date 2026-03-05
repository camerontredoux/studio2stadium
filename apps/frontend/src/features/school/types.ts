import { type ApiSchemas } from "@/lib/api/client";

export type SchoolProfile = ApiSchemas["SchoolsIdResponse"];

export type SchoolEvent = SchoolProfile["events"][number];
export type GlobalEvent = SchoolProfile["globalEvents"][number];
