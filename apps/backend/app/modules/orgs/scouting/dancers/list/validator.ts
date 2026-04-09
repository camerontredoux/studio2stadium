import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    search: vine.string().trim().minLength(1).optional(),
    bib: vine.number().positive().optional(),
    limit: vine.number().min(1).max(200).optional(),
    offset: vine.number().min(0).optional(),
  })
);
export type Validator = Infer<typeof schema>;
