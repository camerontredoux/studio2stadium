import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const submitApplicationSchema = vine.create(
  vine.object({
    idType: vine.string(),
    mediaId: vine.string(),
    location: vine.string(),
  })
);

export type SubmitApplicationSchema = Infer<typeof submitApplicationSchema>;
