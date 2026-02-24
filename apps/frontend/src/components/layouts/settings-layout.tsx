import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import { useSession } from "@/lib/session";
import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = useLocation({ select: (location) => location.pathname });
  const session = useSession();

  const isSubroute = pathname !== "/settings";

  return (
    <Tabs value={pathname}>
      {isSubroute && (
        <TabsList
          variant="underline"
          className="**:data-[slot=tab-indicator]:bg-brand bg-background sticky top-12 z-50 -mt-2 w-full"
        >
          <TabsTab
            nativeButton={false}
            value="/settings/account"
            className="text-brand data-active:text-brand max-sm:text-sm"
            render={<Link to="/settings/account" />}
          >
            Account
          </TabsTab>
          <TabsTab
            nativeButton={false}
            value="/settings/password"
            className="text-brand data-active:text-brand max-sm:text-sm"
            render={<Link to="/settings/password" />}
          >
            Password
          </TabsTab>
          {session.type === "dancer" && (
            <TabsTab
              nativeButton={false}
              value="/settings/membership"
              className="text-brand data-active:text-brand max-sm:text-sm"
              render={<Link to="/settings/membership" />}
            >
              Membership
            </TabsTab>
          )}
          {session.type !== "dancer" && (
            <TabsTab
              nativeButton={false}
              value="/settings/application"
              className="text-brand data-active:text-brand max-sm:text-sm"
              render={<Link to="/settings/application" />}
            >
              Application
            </TabsTab>
          )}
          <TabsTab
            nativeButton={false}
            value="/settings/delete"
            className="text-brand data-active:text-brand max-sm:text-sm"
            render={<Link to="/settings/delete" />}
          >
            Danger
          </TabsTab>
        </TabsList>
      )}
      <div className={`mobile:pb-14 ${isSubroute ? "pt-4" : ""}`}>{children}</div>
    </Tabs>
  );
}
