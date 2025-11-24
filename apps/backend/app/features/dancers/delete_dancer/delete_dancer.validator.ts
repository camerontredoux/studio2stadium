import vine from "@vinejs/vine";
import { InferInput } from "@vinejs/vine/types";

export const deleteDancerSchema = vine.object({});

export const DeleteDancerValidator = vine.compile(deleteDancerSchema);
export type DeleteDancerValidator = InferInput<typeof deleteDancerSchema>;
