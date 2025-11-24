import vine from "@vinejs/vine";
import { InferInput } from "@vinejs/vine/types";

export const getDancersSchema = vine.object({
  page: vine.number().min(1).optional(),
  limit: vine.number().min(1).max(100).optional(),
  status: vine.enum(["active", "inactive"]).optional(),
  search: vine.string().trim().minLength(2).optional(),
});

export const GetDancersValidator = vine.compile(getDancersSchema);
export type GetDancersValidator = InferInput<typeof getDancersSchema>;
