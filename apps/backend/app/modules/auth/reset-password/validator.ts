import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    token: vine.string().minLength(64),
    userId: vine.string().uuid(),
    password: vine.string().minLength(8),
  })
);

export type Validator = Infer<typeof schema>;
