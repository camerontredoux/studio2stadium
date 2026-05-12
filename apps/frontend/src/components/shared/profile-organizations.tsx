import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { $api, type ApiSchemas } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRightIcon, Building2Icon } from "lucide-react";

type MyOrg = ApiSchemas["UsersMeOrgsResponse"][number];

function dashboardLink(org: MyOrg) {
  if (org.role === "admin") {
    return { to: "/o/$orgSlug/admin" as const, label: "Admin" };
  }
  if (org.type === "coach") {
    return { to: "/o/$orgSlug/coach" as const, label: "Coach" };
  }
  return { to: "/o/$orgSlug/dancer" as const, label: "Dancer" };
}

export function ProfileOrganizations() {
  const { data, isError } = useQuery({
    ...$api.queryOptions("get", "/users/me/orgs"),
    retry: false,
    throwOnError: false,
  });

  if (isError || !data || data.length === 0) return null;

  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>Organizations</FrameTitle>
      </FrameHeader>
      <FramePanel className="p-0!">
        <div className="flex flex-col divide-y">
          {data.map((org) => {
            const target = dashboardLink(org);
            return (
              <Link
                key={org.id}
                to={target.to}
                params={{ orgSlug: org.slug }}
                className="hover:bg-accent/50 group flex items-center gap-3 px-4 py-3 transition-colors"
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-background"
                  style={
                    org.primaryColor
                      ? { borderColor: org.primaryColor }
                      : undefined
                  }
                >
                  {org.logoUrl ? (
                    <img
                      src={org.logoUrl}
                      alt={org.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <Building2Icon className="text-muted-foreground size-4" />
                  )}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">
                    {org.name}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {target.label}
                  </span>
                </div>
                <ArrowRightIcon className="text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-colors" />
              </Link>
            );
          })}
        </div>
      </FramePanel>
    </Frame>
  );
}
