import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const createClaimSchema = vine.compile(
  vine.object({
    // The name the org would have registered her under, which is not
    // necessarily the name on her account.
    claimedFirstName: vine.string().trim().minLength(1).maxLength(80),
    claimedLastName: vine.string().trim().minLength(1).maxLength(80),
    // The address she believes was used — often a parent's. Optional, because
    // not knowing it is the usual reason she is here.
    claimedEmail: vine.string().trim().email().optional(),
    note: vine.string().trim().maxLength(500).optional(),
  })
);

export type CreateClaimValidator = Infer<typeof createClaimSchema>;
