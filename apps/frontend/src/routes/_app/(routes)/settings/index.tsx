import { SettingsPage } from "@/features/settings/page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/settings/")({
  component: SettingsPage,
});
