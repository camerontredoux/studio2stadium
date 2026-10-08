import { trackerItemType } from "#database/schema/enums";
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    type: vine.enum(trackerItemType.enumValues),
    // Required for every type but school, whose title is the school name.
    title: vine
      .string()
      .trim()
      .minLength(1)
      .maxLength(200)
      .optional()
      .requiredWhen("type", "!=", "school"),
    // Required for a school item; optional grouping for the rest.
    school: vine
      .string()
      .trim()
      .minLength(1)
      .maxLength(200)
      .optional()
      .requiredWhen("type", "=", "school"),
    date: vine.date({ formats: ["YYYY-MM-DD"] }).optional(),
    notes: vine.string().trim().maxLength(2000).optional(),
    stage: vine.number().withoutDecimals().min(0).optional(),
  })
);

export type Validator = Infer<typeof schema>;
