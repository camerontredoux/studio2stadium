// apps/backend/app/modules/orgs/events/rosters/attach/validator.ts
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const attachSchema = vine.compile(
  vine.object({
    targetUserId: vine.string().uuid(),
    // Set once an admin has been shown which account they are reassigning the
    // entry away from. Without it a claimed entry is refused, not overwritten.
    confirmRelink: vine.boolean().optional(),
  })
);

export type AttachValidator = Infer<typeof attachSchema>;
