import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    styles: vine.array(vine.string()).minLength(1).maxLength(3),
  })
);

export type Validator = Infer<typeof schema>;
