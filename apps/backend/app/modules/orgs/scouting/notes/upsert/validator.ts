import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    content: vine.string().minLength(1).maxLength(5000),
  })
);

export type Validator = Infer<typeof schema>;
