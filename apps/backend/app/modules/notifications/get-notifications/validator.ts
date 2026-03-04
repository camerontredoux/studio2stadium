import vine from "@vinejs/vine";
import type { Infer } from "@vinejs/vine/types";

export const schema = vine.object({
  cursor: vine.string().optional(),
});

export const validator = vine.create(schema);

export type Validator = Infer<typeof schema>;
