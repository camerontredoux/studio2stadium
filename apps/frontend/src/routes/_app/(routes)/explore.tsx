import { queries } from "@/features/explore/api/queries";
import { Page } from "@/features/explore/components/page";
import type { ApiSchemas } from "@/lib/api/client";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/explore")({
  validateSearch: (search: Record<string, unknown>) =>
    search as Partial<Record<ApiSchemas["ParamKey"], string>>,
  beforeLoad: ({ context: { access } }) => {
    access.guard(access.is("core", "dancer"));
  },
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(queries.explore());
  },
  component: Page,
});
