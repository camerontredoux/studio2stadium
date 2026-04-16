import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1).maxLength(160).optional(),
    description: vine.string().trim().nullable().optional(),
    completed: vine.boolean().optional(),
    position: vine.number().min(0).optional(),
  })
);
export type Validator = Infer<typeof schema>;
