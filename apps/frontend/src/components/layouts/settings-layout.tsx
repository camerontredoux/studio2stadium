import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

const pageTitles: Record<string, string> = {
  personal: "Personal",
  portfolio: "Portfolio",
  general: "General",
  membership: "Membership",
};

export function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = useLocation({ select: (location) => location.pathname });
  const segment = pathname.split("/").filter(Boolean).pop() ?? "";
  const pageTitle = pageTitles[segment] ?? segment;

  return (
    <div className="mobile:pb-14 flex flex-col gap-4 pt-1 sm:pt-0">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/settings" />}>
              Settings
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {children}
    </div>
  );
}
