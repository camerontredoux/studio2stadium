import { AccountType } from "#database/generated/types";
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const getFiltersValidator = vine.create(
  vine.object({
    type: vine.enum(AccountType),
  })
);

export type GetFiltersValidator = Infer<typeof getFiltersValidator>;
