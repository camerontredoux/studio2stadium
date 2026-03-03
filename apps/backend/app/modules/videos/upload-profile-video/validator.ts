import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    mediaId: vine.string(),
    caption: vine.string().optional(),
  })
);

export type Validator = Infer<typeof schema>;
