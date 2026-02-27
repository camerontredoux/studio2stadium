import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    key: vine.string(),
  })
);

export type Validator = Infer<typeof schema>;
