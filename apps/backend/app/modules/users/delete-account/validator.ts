import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    feedback: vine.string().trim().maxLength(1000).optional(),
  })
);

export type Validator = Infer<typeof schema>;
