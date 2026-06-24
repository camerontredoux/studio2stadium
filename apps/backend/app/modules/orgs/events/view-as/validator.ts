import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    type: vine.enum(["coach", "dancer"]),
  })
);

export type Validator = Infer<typeof schema>;
