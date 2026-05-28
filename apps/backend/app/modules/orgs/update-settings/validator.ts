import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    defaultTimezone: vine.string().trim().optional().nullable(),
  })
);
export type Validator = Infer<typeof schema>;
