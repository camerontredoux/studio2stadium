import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    firstName: vine.string().trim().minLength(1).optional(),
    lastName: vine.string().trim().minLength(1).optional(),
    email: vine.string().trim().email().optional(),
    organization: vine.string().trim().nullable().optional(),
    bibNumber: vine.number().positive().nullable().optional(),
    profile: vine
      .object({
        gradYear: vine.number().min(1900).max(2100).nullable().optional(),
        gpa: vine.number().min(0).max(5).nullable().optional(),
        studio: vine.string().trim().nullable().optional(),
        state: vine.string().trim().nullable().optional(),
        height: vine.string().trim().nullable().optional(),
        danceStyles: vine.array(vine.string().trim()).nullable().optional(),
        bio: vine.string().trim().nullable().optional(),
      })
      .optional(),
  })
);
export type Validator = Infer<typeof schema>;
