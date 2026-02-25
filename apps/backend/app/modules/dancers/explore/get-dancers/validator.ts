import { divisionCodes } from "#shared/constants/divisions";
import { stateCodes } from "#shared/constants/states";
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

  if (min < 0 || max > 5 || min > max) {
    ctx.report("GPA range must be between 0 and 5", "gpaRange", ctx);
    return;
  }

  ctx.mutate({ min, max }, ctx);
});

export const validator = vine.create(
  vine.object({
    cursor: vine.string().optional(),
    name: vine.string().optional(),
    commonRecruiting: vine.boolean().optional(),
    upcomingEvents: vine.boolean().optional(),
    gpaRange: vine.string().use(gpaRangeRule()).optional(),
    location: vine.enum(stateCodes).optional(),
    division: vine.array(vine.enum(divisionCodes)).optional(),
    sports: vine.array(vine.string()).optional(),
    styles: vine.array(vine.string()).optional(),
  })
);

export type Validator = Infer<typeof validator>;
