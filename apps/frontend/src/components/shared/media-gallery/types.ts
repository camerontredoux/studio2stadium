import type { ApiSchemas } from "@/lib/api/client";

export type Image = ApiSchemas["DancersIdResponse"]["images"][number];

export type Video = ApiSchemas["DancersIdResponse"]["videos"][number];

export type MediaItem =
  | { type: "image"; data: Image }
  | { type: "video"; data: Video };
