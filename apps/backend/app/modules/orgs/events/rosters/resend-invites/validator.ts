import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    ids: vine.array(vine.string().uuid()).minLength(1).maxLength(500),
  })
);
export type Validator = Infer<typeof schema>;
