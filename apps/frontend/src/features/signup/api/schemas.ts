import type { AccountType } from "@/lib/access";
import { passwordSchema } from "@/lib/schemas";
import { z } from "zod";

export const MAX_NAME_LENGTH = 64;
export const MAX_USERNAME_LENGTH = 32;
export const MAX_SCHOOL_NAME_LENGTH = 100;

export const accountTypeSchema = z.enum([
  "dancer",
  "school",
] satisfies AccountType[]);

export const schemas = {
  type: accountTypeSchema,

  search: z.object({
    redirect: z.string().optional(),
    reason: z.string().optional(),
    username: z.string(),
    schoolName: z.string().optional(),
  }),

  signup: z
    .object({
      email: z.email("Enter a valid email address"),
      type: accountTypeSchema,
      firstName: z
        .string()
        .min(2, "First name must be at least 2 characters long")
        .max(
          MAX_NAME_LENGTH,
          `First name must be at most ${MAX_NAME_LENGTH} characters long`,
        ),
      lastName: z
        .string()
        .min(2, "Last name must be at least 2 characters long")
        .max(
          MAX_NAME_LENGTH,
          `Last name must be at most ${MAX_NAME_LENGTH} characters long`,
        ),
      username: z
        .string()
        .min(4, "Username must be at least 4 characters long")
        .max(
          MAX_USERNAME_LENGTH,
          `Username must be at most ${MAX_USERNAME_LENGTH} characters long`,
        ),
      phone: z.string().optional(),
      password: passwordSchema,
      termsChecked: z.boolean(),
      name: z.string().optional(),
      location: z.string().optional(),
      city: z.string().optional(),
      commonRecruiting: z.boolean().optional(),
    })
    .refine(
      (data) =>
        data.type !== "school" || typeof data.commonRecruiting === "boolean",
      {
        path: ["commonRecruiting"],
        error: "Please select an option",
      },
    ),

  available: z.object({
    username: z.string().regex(/^[a-zA-Z0-9_]+$/, {
      error: "Username must be alphanumeric",
    }),
  }),

  schoolAvailable: z.object({
    schoolName: z
      .string()
      .max(MAX_SCHOOL_NAME_LENGTH)
      .regex(/^[a-zA-Z][a-zA-Z -]*[a-zA-Z]$/, {
        error: "Only letters and hyphens allowed",
      }),
  }),
} as const;
