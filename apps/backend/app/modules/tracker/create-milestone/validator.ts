import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    schoolId: vine.string().uuid(),
    title: vine.string().trim().minLength(1).maxLength(80),
  })
);

export type Validator = Infer<typeof schema>;
