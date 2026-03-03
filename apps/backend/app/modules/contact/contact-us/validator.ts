import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(100),
    email: vine.string().email().normalizeEmail(),
    subject: vine.string().trim().minLength(5).maxLength(200),
    message: vine.string().trim().minLength(10).maxLength(2000),
  })
);

export type Validator = Infer<typeof schema>;
