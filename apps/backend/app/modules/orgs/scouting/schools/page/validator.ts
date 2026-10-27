import vine from "@vinejs/vine";
import type { Infer } from "@vinejs/vine/types";

/** A page of the org's schools, by name, optionally narrowed by a search. */
export const schoolPageSchema = vine.compile(
  vine.object({
    eventId: vine.string().uuid().optional(),
    page: vine.number().min(0).optional(),
    limit: vine.number().min(1).max(200).optional(),
    search: vine.string().trim().minLength(1).optional(),
  })
);

export type SchoolPage = Infer<typeof schoolPageSchema>;
