import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    styles: vine.array(vine.string()).maxLength(3).minLength(1),
  })
);

export type Validator = Infer<typeof schema>;
