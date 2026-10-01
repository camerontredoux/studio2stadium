import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    token: vine.string().fixedLength(64),
    // The account the claim link was sent for, so a user signed in as another
    // account is told so rather than told the link is bad.
    userId: vine.string().uuid(),
  })
);

export type Validator = Infer<typeof schema>;
