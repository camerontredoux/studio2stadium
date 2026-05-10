import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    type: vine.enum(["dancer", "coach"] as const),
    search: vine.string().trim().minLength(1).optional(),
    status: vine.enum(["all", "active", "pending"] as const).optional(),
    org: vine.string().trim().minLength(1).optional(),
  })
);
export type Validator = Infer<typeof schema>;
