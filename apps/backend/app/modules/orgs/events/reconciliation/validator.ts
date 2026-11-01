import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const mergeSchema = vine.compile(
  vine.object({
    targetUserId: vine.string().uuid(),
  })
);

export type MergeValidator = Infer<typeof mergeSchema>;

const page = {
  page: vine.number().min(0).optional(),
  limit: vine.number().min(1).max(200).optional(),
  search: vine.string().trim().minLength(1).optional(),
};

export const invitesSchema = vine.compile(
  vine.object({ ...page, claimed: vine.boolean().optional() })
);

export const orphansSchema = vine.compile(vine.object(page));

export type InvitesValidator = Infer<typeof invitesSchema>;
export type OrphansValidator = Infer<typeof orphansSchema>;
