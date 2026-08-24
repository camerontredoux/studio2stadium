import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const resolveClaimSchema = vine.compile(
  vine.object({
    action: vine.enum(["approve", "reject"] as const),
    // Required to approve: the entry the admin decided the claim refers to.
    rosterId: vine.string().uuid().optional(),
  })
);

export type ResolveClaimValidator = Infer<typeof resolveClaimSchema>;
