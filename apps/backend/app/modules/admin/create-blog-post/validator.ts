import { BLOG_ATTACHMENTS } from "#modules/blog/shared/attachments";
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    title: vine.string(),
    content: vine.string(),
    description: vine.string(),
    thumbnail: vine.string(),
    tags: vine.array(vine.string()).optional(),
    // References to already-uploaded R2 objects. Only `name` + `key` are trusted
    // from the client; `size`/`contentType`/`uploadedAt` are derived server-side
    // from R2 metadata. The array length is capped here; per-file and total-size
    // limits are enforced in the service after HEAD-ing each object.
    attachments: vine
      .array(
        vine.object({
          name: vine.string().trim().minLength(1).maxLength(255),
          key: vine.string(),
          size: vine.number().positive().optional(),
        })
      )
      .maxLength(BLOG_ATTACHMENTS.maxFiles)
      .optional(),
  })
);

export type Validator = Infer<typeof schema>;
