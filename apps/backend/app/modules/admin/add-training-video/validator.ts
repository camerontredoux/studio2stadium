import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    title: vine.string(),
    url: vine.string(),
    category: vine.string(),
  })
);

export type Validator = Infer<typeof schema>;
