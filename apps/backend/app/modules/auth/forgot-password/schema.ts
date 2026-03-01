import vine from "@vinejs/vine";
import type { Infer } from "@vinejs/vine/types";

export const forgotPasswordSchema = vine.create(
  vine.object({
    email: vine.string().email(),
  })
);

export type ForgotPasswordSchema = Infer<typeof forgotPasswordSchema>;
