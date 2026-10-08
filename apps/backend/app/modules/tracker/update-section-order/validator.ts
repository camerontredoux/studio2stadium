import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    // School names in display order; null is "Everything else".
    sections: vine
      .array(vine.string().trim().minLength(1).maxLength(200).nullable())
      .maxLength(500),
  })
);

export type Validator = Infer<typeof schema>;
