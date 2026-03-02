import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    params: vine.object({
      id: vine.string().uuid(),
    }),
    status: vine
      .enum(["pending", "in_review", "accepted", "released"])
      .optional(),
    watched: vine.boolean().optional(),
  })
);

export type Validator = Infer<typeof schema>;
