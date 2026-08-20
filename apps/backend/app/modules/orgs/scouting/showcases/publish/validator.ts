import vine from "@vinejs/vine";

export const schema = vine.compile(
  vine.object({
    // Publish every callback a coach made, ignoring max_callbacks_per_coach.
    publishAll: vine.boolean().optional(),
  })
);
