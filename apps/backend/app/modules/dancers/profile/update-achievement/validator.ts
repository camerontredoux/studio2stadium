import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    params: vine.object({
      id: vine.string(),
    }),
    title: vine.string().optional(),
    description: vine.string().optional(),
  })
);

export type Validator = Infer<typeof schema>;
