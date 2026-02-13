import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    currentPassword: vine.string().minLength(8),
    newPassword: vine.string().minLength(8),
  })
);

export type Validator = Infer<typeof schema>;
