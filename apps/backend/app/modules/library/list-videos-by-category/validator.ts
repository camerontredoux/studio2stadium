import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const validator = vine.create(
  vine.object({
    params: vine.object({
      category: vine.string(),
    }),
    page: vine.number(),
  })
);

export type Validator = Infer<typeof validator>;
