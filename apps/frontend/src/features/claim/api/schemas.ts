import { z } from "zod";

export const claimSchemas = {
  /** What the claim link in the Org-ready email carries. */
  claimSearch: z.object({
    token: z.string(),
    userId: z.string(),
  }),
};
