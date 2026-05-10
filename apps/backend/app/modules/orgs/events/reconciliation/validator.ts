import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const mergeSchema = vine.compile(
  vine.object({
    targetUserId: vine.string().uuid(),
  })
);

export type MergeValidator = Infer<typeof mergeSchema>;
