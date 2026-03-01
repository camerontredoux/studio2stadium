import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const validator = vine.create(
  vine.object({
    schoolName: vine.string().trim().minLength(2).maxLength(100),
  })
);

export type Validator = Infer<typeof validator>;
