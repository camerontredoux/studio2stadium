import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    firstName: vine.string().trim().optional(),
    lastName: vine.string().trim().optional(),
    displayEmail: vine.string().trim().optional(),
    phone: vine.string().trim().optional(),
    notifications: vine.boolean().optional(),
  })
);

export type Validator = Infer<typeof schema>;
