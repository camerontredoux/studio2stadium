import { sportCodes } from "#shared/constants/sports";
import { stateCodes } from "#shared/constants/states";
import { styleCodes } from "#shared/constants/styles";
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

const gpaRangeRule = vine.createRule((value, _, ctx) => {
  if (typeof value !== "string") {
    ctx.report("GPA range must be a string", "gpaRange", ctx);
    return;
  }

  const [minStr, maxStr] = value.split(",");
  const min = Number.parseFloat(minStr);
  const max = Number.parseFloat(maxStr);

  if (Number.isNaN(min) || Number.isNaN(max)) {
    ctx.report("Invalid GPA range", "gpaRange", ctx);
    return;
  }

  if (min < 0 || max > 4 || min > max) {
    ctx.report("GPA range must be between 0 and 4", "gpaRange", ctx);
    return;
  }

  ctx.mutate({ min, max }, ctx);
});

const csvEnum =
  <T extends readonly string[]>(validValues: T) =>
  (value: string) => {
    const parts = value.split(",").map((v) => v.trim());
    for (const part of parts) {
      if (!validValues.includes(part)) {
        throw new Error(
          `Invalid value: ${part}. Must be one of: ${validValues.map((v) => `"${v}"`).join(", ")}`
        );
      }
    }
    return parts as T[number][];
  };

export const validator = vine.create(
  vine.object({
    name: vine.string().optional(),
    premium: vine.boolean().optional(),
    following: vine.boolean().optional(),
    gpaRange: vine.any().use(gpaRangeRule()).optional(),
    location: vine.enum(stateCodes).optional(),
    sports: vine.string().transform(csvEnum(sportCodes)).optional(),
    styles: vine.string().transform(csvEnum(styleCodes)).optional(),
    page: vine.number().optional(),
    limit: vine.number().optional(),
  })
);

export type Validator = Infer<typeof validator>;
