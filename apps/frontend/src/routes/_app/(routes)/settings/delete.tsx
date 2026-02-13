import { DangerSettings } from "@/features/settings/components/danger-settings";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/settings/delete")({
  component: DangerSettings,
});
