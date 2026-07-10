import { dashboardLink } from "@/components/shared/org-dashboard-link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { $api } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "OR"
  );
}

export function OrgStoriesRail() {
  const { data, isError } = useQuery({
    ...$api.queryOptions("get", "/users/me/orgs"),
    retry: false,
    throwOnError: false,
  });

  if (isError || !data || data.length === 0) return null;

  return (
    <section className="flex flex-col gap-2 border-b pb-3">
      <h2 className="text-muted-foreground text-xs font-medium">
        Organizations
      </h2>
      <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
        {data.map((org) => {
          const target = dashboardLink(org);

          return (
            <Link
              key={org.id}
              to={target.to}
              params={{ orgSlug: org.slug }}
              preload={false}
              className="focus-visible:ring-ring/50 flex w-16 shrink-0 flex-col items-center gap-1.5 rounded-md outline-none focus-visible:ring-2"
            >
              <Avatar
                className="size-14 border-2"
                style={
                  org.primaryColor
                    ? { borderColor: org.primaryColor }
                    : undefined
                }
              >
                <AvatarImage src={org.logoUrl ?? undefined} alt={org.name} />
                <AvatarFallback className="text-sm font-semibold">
                  {getInitials(org.name)}
                </AvatarFallback>
              </Avatar>
              <span className="w-full truncate text-center text-xs">
                {org.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
