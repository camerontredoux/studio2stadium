import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    params: vine.object({
      id: vine.string().uuid(),
    }),
    email: vine.string().email(),
    role: vine.enum(["admin", "member"]),
    type: vine.enum(["coach", "dancer", "organizer"]),
  })
);

export type Validator = Infer<typeof schema>;
