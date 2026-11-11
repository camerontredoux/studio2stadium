import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    // Every one of the dancer's references, in the order to display them.
    ids: vine.array(vine.string().uuid()).maxLength(200),
  })
);

export type Validator = Infer<typeof schema>;
