import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    params: vine.object({
      id: vine.string().uuid(),
    }),
    title: vine.string().trim().minLength(1).maxLength(80).optional(),
    completed: vine.boolean().optional(),
  })
);

export type Validator = Infer<typeof schema>;
