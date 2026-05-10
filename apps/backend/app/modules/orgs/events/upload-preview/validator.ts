import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    file: vine.file({ size: "10mb", extnames: ["csv"] }),
  })
);
export type Validator = Infer<typeof schema>;
