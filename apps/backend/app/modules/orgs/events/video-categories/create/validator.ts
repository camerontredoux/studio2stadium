import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(160),
  })
);
export type Validator = Infer<typeof schema>;
