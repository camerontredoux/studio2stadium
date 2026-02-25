import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    schoolId: vine.array(vine.string().uuid()),
    videoId: vine.string(),
  })
);

export type Validator = Infer<typeof schema>;
