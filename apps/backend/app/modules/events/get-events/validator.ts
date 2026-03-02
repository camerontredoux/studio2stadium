import { stateCodes } from "#shared/constants/states";
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const validator = vine.create(
  vine.object({
    schoolName: vine.string().optional(),
    location: vine.enum(stateCodes).optional(),
    date: vine
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  })
);

export type Validator = Infer<typeof validator>;
