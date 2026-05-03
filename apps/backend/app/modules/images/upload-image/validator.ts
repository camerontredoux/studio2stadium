import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    type: vine.enum(["avatar", "feed", "id", "blog", "schedule"]),
    contentType: vine.string(),
  })
);

export type Validator = Infer<typeof schema>;
