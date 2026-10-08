import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    school: vine.string().trim().minLength(1).maxLength(200),
  })
);

export type Validator = Infer<typeof schema>;
