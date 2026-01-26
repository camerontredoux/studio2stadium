import { differenceInYears, isExists } from "date-fns";
import { z } from "zod";

export const schemas = {
  onboard: z.object({
    birthday: z
      .object({
        month: z.coerce.number<number>().int().min(1).max(12),
        day: z.coerce.number<number>().int().min(1).max(31),
        year: z.coerce
          .number<number>()
          .int()
          .min(1900)
          .max(new Date().getFullYear()),
      })
      .refine((data) => isExists(data.year, data.month - 1, data.day), {
        error: "Invalid date",
      })
      .refine(
        (data) => {
          const birthday = new Date(data.year, data.month - 1, data.day);
          const age = differenceInYears(new Date(), birthday);
          return age >= 13;
        },
        {
          error: "You must be thirteen years of age or older to sign up",
        },
      ),
    location: z.string(),
    phoneNumber: z.string(),
  }),
} as const;
