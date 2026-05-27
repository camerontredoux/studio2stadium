import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    params: vine.object({
      id: vine.string().uuid(),
      memberId: vine.string().uuid(),
    }),
  })
);

export type Validator = Infer<typeof schema>;
