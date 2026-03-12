import { OutboxStatsPage } from "@/features/admin/outbox-stats";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/(routes)/admin/outbox-stats")({
  component: OutboxStatsPage,
});
