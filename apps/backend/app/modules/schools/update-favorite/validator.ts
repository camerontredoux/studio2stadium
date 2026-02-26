import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    params: vine.object({
      id: vine.string().uuid(),
    }),
    comment: vine.string().optional().nullable(),
    rating: vine.number().optional().nullable(),
  })
);

export type Validator = Infer<typeof schema>;
