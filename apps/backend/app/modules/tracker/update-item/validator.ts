import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    params: vine.object({
      id: vine.string().uuid(),
    }),
    title: vine.string().trim().minLength(1).maxLength(200).optional(),
    schoolId: vine.string().uuid().nullable().optional(),
    eventId: vine.string().uuid().nullable().optional(),
    date: vine
      .date({ formats: ["YYYY-MM-DD"] })
      .nullable()
      .optional(),
    notes: vine.string().trim().maxLength(2000).nullable().optional(),
    stage: vine.number().withoutDecimals().min(0).optional(),
  })
);

export type Validator = Infer<typeof schema>;
