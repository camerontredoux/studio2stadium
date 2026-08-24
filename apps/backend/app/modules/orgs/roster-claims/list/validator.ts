import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const listClaimsSchema = vine.compile(
  vine.object({
    status: vine.enum(["pending", "approved", "rejected"] as const).optional(),
  })
);

export type ListClaimsValidator = Infer<typeof listClaimsSchema>;
