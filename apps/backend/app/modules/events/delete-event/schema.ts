import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const deleteEventSchema = vine.create(
  vine.object({
    params: vine.object({
      id: vine.string().uuid(),
    }),
  })
);

export type DeleteEventSchema = Infer<typeof deleteEventSchema>;
