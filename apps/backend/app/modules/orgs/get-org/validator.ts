import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    slug: vine.string().trim().minLength(1),
  })
);

export type Validator = Infer<typeof schema>;
