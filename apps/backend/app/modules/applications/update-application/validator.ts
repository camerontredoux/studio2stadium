import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const updateApplicationSchema = vine.create(
  vine.object({
    idType: vine.string().optional(),
    mediaId: vine.string().optional(),
    location: vine.string().optional(),
  })
);

export type UpdateApplicationSchema = Infer<typeof updateApplicationSchema>;
