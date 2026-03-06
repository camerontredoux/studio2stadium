import { ApplicationsPage } from "@/features/admin/applications";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/(routes)/admin/applications")({
  component: ApplicationsPage,
});
