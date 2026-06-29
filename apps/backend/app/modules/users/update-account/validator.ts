import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

/** Shared with admin routes that update a school account by username */
export const accountFields = {
  firstName: vine.string().trim().optional(),
  lastName: vine.string().trim().optional(),
  displayEmail: vine.string().trim().optional(),
  phone: vine.string().trim().optional(),
  notifications: vine.boolean().optional(),
};

export const schema = vine.create(
  vine.object({
    ...accountFields,
    username: vine
      .string()
      .trim()
      .minLength(4)
      .maxLength(32)
      .alphaNumeric({ allowUnderscores: true })
      .optional(),
  })
);

export type Validator = Infer<typeof schema>;
