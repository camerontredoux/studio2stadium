import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const submitApplicationSchema = vine.create(
  vine.object({
    mediaId: vine.string(),
    phone: vine.string(),
  })
);

export type SubmitApplicationSchema = Infer<typeof submitApplicationSchema>;
