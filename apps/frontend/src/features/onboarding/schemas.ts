import { birthdaySchema } from "@/lib/schemas";
import { z } from "zod";

export const schemas = {
  onboard: z.object({
    birthday: birthdaySchema,
    location: z.string(),
    phoneNumber: z.string(),
  }),
} as const;
