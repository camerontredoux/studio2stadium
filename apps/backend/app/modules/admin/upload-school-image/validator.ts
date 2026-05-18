import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    params: vine.object({
      username: vine.string(),
    }),
    key: vine.string(),
  })
);

export type Validator = Infer<typeof schema>;
