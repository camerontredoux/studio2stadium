import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    // A real code is 71 characters; the cap keeps arbitrary QR text out.
    code: vine.string().trim().minLength(1).maxLength(200),
  })
);

export type Validator = Infer<typeof schema>;
