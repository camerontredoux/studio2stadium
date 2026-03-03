import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    type: vine.enum(["bug", "feature", "improvement", "other"]),
    message: vine.string().trim().minLength(10).maxLength(2000),
    page: vine.string().optional(),
  })
);

export type Validator = Infer<typeof schema>;
