import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const searchSchema = vine.compile(
  vine.object({
    q: vine.string().trim().minLength(0).optional(),
  })
);

export type SearchValidator = Infer<typeof searchSchema>;
