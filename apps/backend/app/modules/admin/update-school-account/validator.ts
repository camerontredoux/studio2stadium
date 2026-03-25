import { accountFields } from "#modules/users/update-account/validator";
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    params: vine.object({
      username: vine.string(),
    }),
    ...accountFields,
  })
);

export type Validator = Infer<typeof schema>;
