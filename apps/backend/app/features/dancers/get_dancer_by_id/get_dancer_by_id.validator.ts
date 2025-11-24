import vine from "@vinejs/vine";
import { InferInput } from "@vinejs/vine/types";

export const getDancerByIdSchema = vine.object({});

export const GetDancerByIdValidator = vine.compile(getDancerByIdSchema);
export type GetDancerByIdValidator = InferInput<typeof getDancerByIdSchema>;
