import { PasswordSettings } from "@/features/settings/components/password-settings";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/settings/password")({
  component: PasswordSettings,
});
