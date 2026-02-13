import { differenceInYears, isExists } from "date-fns";
import { z } from "zod";

export const MAX_PASSWORD_LENGTH = 64;

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(MAX_PASSWORD_LENGTH)
  .refine(
    (password) => /[A-Z]/.test(password),
    "Password must contain at least one uppercase letter",
  )
  .refine(
    (password) => /[a-z]/.test(password),
    "Password must contain at least one lowercase letter",
  )
  .refine(
    (password) => /[0-9]/.test(password),
    "Password must contain at least one number",
  )
  .refine(
    (password) => /[ !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/.test(password),
    "Password must contain at least one special character",
  );

export const birthdaySchema = z
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
  );
