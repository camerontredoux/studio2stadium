import { useNavigate } from "@tanstack/react-router";

import { ShellSidebarBrand } from "@/components/event/shell";
import { useOrg } from "@/features/org/context/use-org";

import { monogram } from "./monogram";

/** The coach/dancer sidebar brand: monogram + org name, linking to the area dashboard. */
export function OrgSidebarBrand({ dashboardTo }: { dashboardTo: string }) {
  const { org } = useOrg();
  const navigate = useNavigate();
  return (
    <ShellSidebarBrand
      mark={monogram(org.name)}
      name={org.name}
      caret={false}
      aria-label={`${org.name}: dashboard`}
      onClick={() =>
        void navigate({ to: dashboardTo, params: { orgSlug: org.slug } })
      }
    />
  );
}
