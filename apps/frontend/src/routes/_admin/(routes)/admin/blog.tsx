import { BlogPage } from "@/features/admin/blog";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/(routes)/admin/blog")({
  component: BlogPage,
});
