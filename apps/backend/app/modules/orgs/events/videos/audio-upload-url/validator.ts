import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    contentType: vine.enum(["audio/mpeg", "audio/mp3"]),
    filename: vine
      .string()
      .trim()
      .minLength(1)
      .maxLength(300)
      .regex(/\.mp3$/i),
  })
);
export type Validator = Infer<typeof schema>;
