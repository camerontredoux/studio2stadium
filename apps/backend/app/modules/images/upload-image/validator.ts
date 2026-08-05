import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    type: vine.enum(["avatar", "feed", "id", "blog", "schedule"]),
    contentType: vine.string(),
    // Client-declared byte size, used only for early UX validation of blog
    // PDFs. The server re-verifies the real size from R2 metadata before
    // attaching, so this is optional and never trusted as the source of truth.
    size: vine.number().positive().optional(),
  })
);

export type Validator = Infer<typeof schema>;
