import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    coachRosterId: vine.string().uuid(),
  })
);

export type Validator = Infer<typeof schema>;
