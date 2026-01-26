import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const getUsernameAvailableValidator = vine.create(
  vine.object({
    username: vine.string().trim().minLength(4).maxLength(32),
  })
);

export type GetUsernameAvailableValidator = Infer<
  typeof getUsernameAvailableValidator
>;
