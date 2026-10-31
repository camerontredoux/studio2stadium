import { createFileRoute } from "@tanstack/react-router";

import { SettingsPage } from "@/features/org/live/admin/settings/settings-page";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/admin/settings",
)({
  component: SettingsRoute,
});

function SettingsRoute() {
  const { orgSlug } = Route.useParams();
  return <SettingsPage orgSlug={orgSlug} />;
}
