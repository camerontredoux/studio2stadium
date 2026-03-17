import { adminQueries } from "@/features/admin/api/queries";
import { DancersPage } from "@/features/admin/dancers";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  page: z.coerce.number().optional().default(0),
  limit: z.coerce.number().optional().default(10),
  sortBy: z
    .enum([
      "createdAt",
      "location",
      "gpa",
      "gradYear",
      "username",
      "firstName",
      "lastName",
      "verified",
      "email",
    ])
    .optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
});

export const Route = createFileRoute("/_admin/(routes)/admin/dancers")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context: { queryClient }, deps: { search } }) => {
    queryClient.ensureQueryData(adminQueries.dancers(search));
  },
  component: DancersPage,
});
