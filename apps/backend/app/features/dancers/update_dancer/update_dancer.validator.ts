import vine from "@vinejs/vine";
import { InferInput } from "@vinejs/vine/types";

export const updateDancerSchema = vine.object({});

export const UpdateDancerValidator = vine.compile(updateDancerSchema);
export type UpdateDancerValidator = InferInput<typeof updateDancerSchema>;
