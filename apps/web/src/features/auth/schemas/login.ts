import z from "zod";

export const search = z.object({
  redirect: z.string().optional(),
});
