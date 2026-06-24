import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    kind: vine.enum(["invite", "roster-added", "school-account-invite"]),
    eventId: vine.string().uuid().optional(),
    audience: vine.enum(["dancer", "coach"]).optional(),
  })
);
export type Validator = Infer<typeof schema>;
