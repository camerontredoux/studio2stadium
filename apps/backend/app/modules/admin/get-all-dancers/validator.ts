import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const validator = vine.create(
  vine.object({
    page: vine.number().min(0).optional(),
    limit: vine.number().min(1).max(100).optional(),
  })
);

export type Validator = Infer<typeof validator>;
