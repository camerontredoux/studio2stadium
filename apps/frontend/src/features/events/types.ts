import type { ApiSchemas } from "@/lib/api/client";

export type ApiEvent = ApiSchemas["EventsIdResponse"];
export type EventCard = ApiSchemas["EventsResponse"][number];
