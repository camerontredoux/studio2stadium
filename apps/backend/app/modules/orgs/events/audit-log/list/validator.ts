import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    page: vine.number().min(0).optional(),
    limit: vine.number().min(1).max(200).optional(),
    search: vine.string().trim().minLength(1).optional(),
    action: vine
      .enum([
        "upload",
        "create",
        "update",
        "delete",
        "activate",
        "resend_invite",
      ] as const)
      .optional(),
    resource: vine
      .enum(["roster", "event", "checklist", "csv_upload", "invite"] as const)
      .optional(),
    actorId: vine.string().trim().minLength(1).optional(),
    from: vine.string().trim().minLength(1).optional(),
    to: vine.string().trim().minLength(1).optional(),
    sortDir: vine.enum(["asc", "desc"] as const).optional(),
  }),
);

export type Validator = Infer<typeof schema>;
