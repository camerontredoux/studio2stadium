import { blogQueries } from "@/features/blog/api/queries";
import { BlogPage } from "@/features/blog/page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/resources/blog")({
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(blogQueries.all());
  },
  component: BlogPage,
});
