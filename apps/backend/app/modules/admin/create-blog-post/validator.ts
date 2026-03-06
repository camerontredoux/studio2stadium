import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    title: vine.string(),
    content: vine.string(),
    description: vine.string(),
    thumbnail: vine.string(),
    tags: vine.array(vine.string()).optional(),
  })
);

export type Validator = Infer<typeof schema>;
