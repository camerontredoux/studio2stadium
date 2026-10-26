import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

// A query string carries one value as a string and several as an array.
function oneOrMany<const T extends readonly string[]>(values: T) {
  return vine.union([
    vine.union.if((v) => Array.isArray(v), vine.array(vine.enum(values))),
    vine.union.else(vine.enum(values).transform((v) => [v])),
  ]);
}

export const schema = vine.compile(
  vine.object({
    page: vine.number().min(0).optional(),
    limit: vine.number().min(1).max(200).optional(),
    search: vine.string().trim().minLength(1).optional(),
    // `check_in` is an `update` of a roster entry's `checkedInAt`; `update`
    // then means every other update.
    actions: oneOrMany([
      "upload",
      "create",
      "update",
      "delete",
      "activate",
      "resend_invite",
      "check_in",
    ] as const).optional(),
    // Must stay in step with the `audit_resource` enum — entries are written
    // for every value here, so omitting one silently makes those rows
    // unfilterable rather than failing loudly.
    resources: oneOrMany([
      "roster",
      "event",
      "checklist",
      "csv_upload",
      "invite",
      "video_category",
      "video",
    ] as const).optional(),
    actorId: vine.string().trim().minLength(1).optional(),
    from: vine.string().trim().minLength(1).optional(),
    to: vine.string().trim().minLength(1).optional(),
    sortDir: vine.enum(["asc", "desc"] as const).optional(),
  })
);

export type Validator = Infer<typeof schema>;
