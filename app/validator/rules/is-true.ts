import { FieldContext } from "@vinejs/vine/types";
import vine, { VineBoolean } from "@vinejs/vine";

export const isTrueRule = vine.createRule(
  function isTrue(value: unknown, _options: any, field: FieldContext) {
    if (typeof value !== "boolean") {
      field.report("{{ field }} is not a boolean", "isTrue", field);
      return;
    }

    if (!value) {
      field.report("{{ field }} must be true", "isTrue", field);
    }
  },
  { implicit: true }
);

VineBoolean.macro("isTrue", function (this: VineBoolean) {
  return this.use(isTrueRule());
});

declare module "@vinejs/vine" {
  export interface VineBoolean {
    isTrue(): this;
  }
}
