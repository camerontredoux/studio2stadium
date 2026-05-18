import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1).maxLength(300),
    categoryId: vine.string().uuid(),
    youtubeId: vine.string().trim().minLength(1).maxLength(20),
    audioKey: vine.string().maxLength(500).nullable().optional(),
    audioFilename: vine.string().maxLength(300).nullable().optional(),
  })
);
export type Validator = Infer<typeof schema>;
