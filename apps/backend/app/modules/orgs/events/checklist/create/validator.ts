import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1).maxLength(160),
    description: vine.string().trim().optional(),
  })
);
export type Validator = Infer<typeof schema>;
