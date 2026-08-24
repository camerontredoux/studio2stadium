import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const createClaimSchema = vine.compile(
  vine.object({
    // The name the org would have registered them under, which is not
    // necessarily the name on their account.
    claimedFirstName: vine.string().trim().minLength(1).maxLength(80),
    claimedLastName: vine.string().trim().minLength(1).maxLength(80),
    // The address they believe was used, often a parent's. Optional, because
    // not knowing it is the usual reason they are here.
    claimedEmail: vine.string().trim().email().optional(),
    note: vine.string().trim().maxLength(500).optional(),
  })
);

export type CreateClaimValidator = Infer<typeof createClaimSchema>;
