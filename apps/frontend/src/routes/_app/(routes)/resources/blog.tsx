import { BlogPage } from "@/features/blog/page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/resources/blog")({
  component: BlogPage,
});
