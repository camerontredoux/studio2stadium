import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Link } from "@tanstack/react-router";
import { ArrowRightIcon, Building2Icon } from "lucide-react";

export type OrgListItem = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  subtitle?: string;
};

type OrgListLink = {
  to:
    | "/o/$orgSlug/login"
    | "/o/$orgSlug/admin"
    | "/o/$orgSlug/coach"
    | "/o/$orgSlug/dancer";
  subtitle?: string;
};

type OrgListProps = {
  orgs: OrgListItem[];
  getLink: (org: OrgListItem) => OrgListLink;
  title?: string;
};

export function OrgList({ orgs, getLink, title = "Organizations" }: OrgListProps) {
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>{title}</FrameTitle>
      </FrameHeader>
      <FramePanel className="p-0!">
        <div className="flex flex-col divide-y">
          {orgs.map((org) => {
            const target = getLink(org);
            const subtitle = target.subtitle ?? org.subtitle;
            return (
              <Link
                key={org.id}
                to={target.to}
                params={{ orgSlug: org.slug }}
                preload={false}
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
                  <span className="truncate text-sm font-medium">{org.name}</span>
                  {subtitle ? (
                    <span className="text-muted-foreground text-xs">
                      {subtitle}
                    </span>
                  ) : null}
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
