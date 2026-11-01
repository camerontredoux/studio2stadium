import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

/**
 * One Roster Entry, with the columns the CSV upload requires for its type:
 * a dancer needs a bib number, a coach needs a school. `userId` links an
 * existing account; its email then replaces the one sent.
 */
export const schema = vine.compile(
  vine.object({
    type: vine.enum(["dancer", "coach"] as const),
    firstName: vine.string().trim().minLength(1).maxLength(255),
    lastName: vine.string().trim().minLength(1).maxLength(255),
    email: vine.string().trim().email(),
    bibNumber: vine.number().positive().withoutDecimals().optional(),
    organization: vine.string().trim().minLength(1).maxLength(255).optional(),
    // Free-tier Users only; ignored otherwise.
    paid: vine.boolean().optional(),
    userId: vine.string().uuid().optional(),
  })
);
export type Validator = Infer<typeof schema>;
