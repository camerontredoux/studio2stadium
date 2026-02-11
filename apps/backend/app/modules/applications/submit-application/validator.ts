import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const validator = vine.create(
  vine.object({
    // TODO: define fields
  })
);

export type Validator = Infer<typeof validator>;
