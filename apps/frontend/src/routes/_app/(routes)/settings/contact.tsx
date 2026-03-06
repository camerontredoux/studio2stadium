import { ContactSettings } from "@/features/settings/components/contact-settings";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/settings/contact")({
  component: ContactSettings,
});
