import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link, useLocation } from "@tanstack/react-router";
import { SettingsIcon } from "lucide-react";
import type { ReactNode } from "react";

export function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = useLocation({ select: (location) => location.pathname });
  const segment = pathname.split("/").filter(Boolean).pop();

  const pageTitles: Record<string, string> = {
    account: "Account",
    password: "Password",
    membership: "Membership",
    application: "Application",
    delete: "Danger",
  };

  const pageTitle = segment ? pageTitles[segment] : undefined;

  return (
    <div className="mobile:pb-14 flex flex-col gap-4 pt-1 sm:pt-0">
      <Breadcrumb className="p-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              className="flex items-center gap-1"
              render={<Link to="/settings" />}
            >
              <SettingsIcon className="size-4" />
              Settings
            </BreadcrumbLink>
          </BreadcrumbItem>
          {pageTitle && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
      {children}
    </div>
  );
}
