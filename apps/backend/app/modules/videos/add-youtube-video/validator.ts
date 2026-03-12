import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    videoId: vine.string().trim().minLength(1).maxLength(20),
    caption: vine.string().trim().maxLength(500).optional(),
  })
);

export type Validator = Infer<typeof schema>;
