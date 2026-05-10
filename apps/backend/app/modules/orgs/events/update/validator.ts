import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(160).optional(),
    startDate: vine
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    endDate: vine
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    venueName: vine.string().trim().optional(),
    venueAddress: vine.string().trim().optional(),
    contactEmail: vine.string().email().optional(),
    schedulePdfUrl: vine.string().optional().nullable(),
    isActive: vine.boolean().optional(),
  })
);
export type Validator = Infer<typeof schema>;
