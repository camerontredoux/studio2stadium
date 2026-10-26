import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    /** Matches the bib, name or studio the coach sees on a row. */
    search: vine.string().trim().minLength(1).optional(),
    bib: vine.number().positive().optional(),
    interested: vine.boolean().optional(),
    eventId: vine.string().uuid().optional(),
    filter: vine
      .enum(["all", "favorites", "calledBack", "rated"] as const)
      .optional(),
    /** `rank` is the dashboard's order: rating, then favourites, then bib. */
    sortBy: vine
      .enum(["bib", "name", "year", "studio", "gpa", "rating", "rank"] as const)
      .optional(),
    sortDir: vine.enum(["asc", "desc"] as const).optional(),
    page: vine.number().withoutDecimals().min(0).optional(),
    limit: vine.number().withoutDecimals().min(1).max(200).optional(),
  })
);
export type Validator = Infer<typeof schema>;
