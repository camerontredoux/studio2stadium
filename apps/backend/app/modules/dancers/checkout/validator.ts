import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    type: vine.enum(["monthly", "yearly"]),
  })
);

export type Validator = Infer<typeof schema>;
