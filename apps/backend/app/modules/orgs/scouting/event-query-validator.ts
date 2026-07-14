import vine from "@vinejs/vine";
import type { Infer } from "@vinejs/vine/types";

export const eventQuerySchema = vine.compile(
  vine.object({
    eventId: vine.string().uuid().optional(),
  })
);

export type EventQuery = Infer<typeof eventQuerySchema>;
