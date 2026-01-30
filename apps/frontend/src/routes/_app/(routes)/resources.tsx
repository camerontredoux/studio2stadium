import { Page } from "@/features/resources/components/page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/resources")({
  component: Page,
});
