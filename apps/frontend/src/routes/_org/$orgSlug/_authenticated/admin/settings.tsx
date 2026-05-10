import { createFileRoute } from "@tanstack/react-router";
import { SettingsIcon } from "lucide-react";
import { useOrg } from "@/features/org/context/use-org";
import {
  AdminPlaceholder,
  SummaryStat,
} from "@/features/org/components/admin-placeholder";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/admin/settings",
)({
  component: SettingsPage,
});

function SettingsPage() {
  const { orgSlug } = Route.useParams();
  const { org } = useOrg();

  return (
    <AdminPlaceholder
      orgSlug={orgSlug}
      title="Org settings"
      subtitle="Branding, members, and organizational preferences"
      icon={SettingsIcon}
      emptyTitle="Settings coming soon"
      emptyDescription={
        <>
          Brand color picker, logo upload, and member management land in the
          next release.
        </>
      }
      summary={
        <>
          <SummaryStat label="Organization" value={org.name} hint={org.slug} />
          <SummaryStat
            label="Brand color"
            value={
              <span className="inline-flex items-center gap-2">
                <span
                  className="border-border/60 inline-block size-5 rounded-full border"
                  style={{
                    backgroundColor: org.primaryColor ?? "var(--color-primary)",
                  }}
                  aria-hidden="true"
                />
                <span className="font-mono text-base">
                  {org.primaryColor ?? "default"}
                </span>
              </span>
            }
            hint="primary"
          />
          <SummaryStat
            label="Logo"
            value={org.logoUrl ? "Uploaded" : "None"}
            hint={org.logoUrl ? "" : "placeholder shown"}
          />
        </>
      }
    />
  );
}
