import vine from "@vinejs/vine";
import type { Infer } from "@vinejs/vine/types";

/** A page of a showcase's called-back dancers, in bib order. */
export const boardPageSchema = vine.compile(
  vine.object({
    page: vine.number().min(0).optional(),
    limit: vine.number().min(1).max(500).optional(),
  })
);

export type BoardPage = Infer<typeof boardPageSchema>;
