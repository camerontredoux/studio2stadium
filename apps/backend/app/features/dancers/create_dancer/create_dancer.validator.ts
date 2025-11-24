import vine from "@vinejs/vine";
import { InferInput } from "@vinejs/vine/types";

export const createDancerSchema = vine.object({});

export const CreateDancerValidator = vine.compile(createDancerSchema);
export type CreateDancerValidator = InferInput<typeof createDancerSchema>;
