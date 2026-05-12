// apps/backend/app/modules/orgs/events/rosters/attach/validator.ts
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const attachSchema = vine.compile(
  vine.object({
    targetUserId: vine.string().uuid(),
  })
);

export type AttachValidator = Infer<typeof attachSchema>;
