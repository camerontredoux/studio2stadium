import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const validator = vine.create(
  vine.object({
    params: vine.object({
      id: vine.string().uuid(),
    }),
  })
);

export type Validator = Infer<typeof validator>;
