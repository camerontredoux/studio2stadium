import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    type: vine.enum(["dancer", "coach"] as const),
    page: vine.number().min(0).optional(),
    limit: vine.number().min(1).max(200).optional(),
    search: vine.string().trim().minLength(1).optional(),
    status: vine.enum(["all", "active", "pending"] as const).optional(),
    org: vine.string().trim().minLength(1).optional(),
    sortBy: vine
      .enum([
        "lastName",
        "firstName",
        "email",
        "bibNumber",
        "organization",
        "createdAt",
        "isRegistered",
        "checkedInAt",
      ] as const)
      .optional(),
    sortDir: vine.enum(["asc", "desc"] as const).optional(),
  })
);
export type Validator = Infer<typeof schema>;
