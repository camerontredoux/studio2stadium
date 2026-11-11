import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    // Every image and video on the owner's profile, in gallery order.
    items: vine
      .array(
        vine.object({
          type: vine.enum(["image", "video"] as const),
          id: vine.string().uuid(),
        })
      )
      .maxLength(500),
  })
);

export type Validator = Infer<typeof schema>;
