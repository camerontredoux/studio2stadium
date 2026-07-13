import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    search: vine.string().trim().minLength(1).optional(),
    bib: vine.number().positive().optional(),
    interested: vine.boolean().optional(),
    eventId: vine.string().uuid().optional(),
  })
);
export type Validator = Infer<typeof schema>;
