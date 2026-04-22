import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    params: vine.object({
      username: vine.string(),
    }),
    skills: vine
      .array(
        vine.object({
          skillId: vine.string(),
          weight: vine.number().min(1).max(5).parse((v) => Math.round(v as number)),
        })
      )
      .minLength(1),
  })
);

export type Validator = Infer<typeof schema>;
