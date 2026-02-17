import vine from "@vinejs/vine";
import { Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    params: vine.object({
      id: vine.string(),
    }),
  })
);

export type Validator = Infer<typeof schema>;
