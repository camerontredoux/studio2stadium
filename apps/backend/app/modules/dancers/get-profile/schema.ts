import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const getProfileSchema = vine.create(
  vine.object({
    params: vine.object({
      username: vine.string(),
    }),
  })
);

export type GetProfileSchema = Infer<typeof getProfileSchema>;
