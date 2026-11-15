import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    sessionId: vine.string().trim().startsWith("cs_").maxLength(255),
  })
);

export type Validator = Infer<typeof schema>;
