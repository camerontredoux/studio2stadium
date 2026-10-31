import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const validator = vine.create(
  vine.object({
    code: vine.string().regex(/^[0-9a-f]{64}$/),
    // A path on the frontend to land on, such as /resources/favorites?tab=2.
    // One leading slash and no backslash or whitespace, so it can never name
    // another origin (//host or /\host).
    redirect: vine
      .string()
      .maxLength(2048)
      .regex(/^\/(?![/\\])[^\s\\]*$/)
      .optional(),
  })
);

export type Validator = Infer<typeof validator>;
