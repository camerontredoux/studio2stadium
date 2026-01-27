import { SettingsIcon } from "lucide-react";
import { type ReactNode } from "react";
import { ToastProvider } from "../../ui/toast";
import { TopNavbar } from "./navbar/navbar";
import { NavLink } from "./sidebar/nav-link";
import { SideNav } from "./sidebar/side-nav";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <ToastProvider>
      <div className="min-h-screen">
        <TopNavbar />
        <div className="pt-12 max-w-2xl lg:max-w-5xl xl:max-w-7xl mx-auto flex">
          {/* Left Sidebar */}
          <SideNav />

          <main className="flex-1 min-w-0 pl-0 p-2 md:p-0 md:pr-4 lg:pr-0 md:pt-2 xl:pt-4">
            {children}
          </main>

          {/* Right Sidebar */}
          <aside className="hidden lg:block w-80 xl:w-96 shrink-0">
            <div className="sticky top-12 p-2 xl:p-4 space-y-2">
              <div className="flex flex-col border rounded-xl p-2 space-y-1">
                <NavLink to="/settings" label="Settings">
                  <SettingsIcon className="size-4" />
                </NavLink>
                <NavLink to="/settings" label="Settings">
                  <SettingsIcon className="size-4" />
                </NavLink>
              </div>
              <div className="flex flex-col border rounded-xl p-2 space-y-1">
                <NavLink to="/settings" label="Settings">
                  <SettingsIcon className="size-4" />
                </NavLink>
                <NavLink to="/settings" label="Settings">
                  <SettingsIcon className="size-4" />
                </NavLink>
              </div>
              <div className="flex flex-col border rounded-xl p-2 space-y-1">
                <NavLink to="/settings" label="Settings">
                  <SettingsIcon className="size-4" />
                </NavLink>
                <NavLink to="/settings" label="Settings">
                  <SettingsIcon className="size-4" />
                </NavLink>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </ToastProvider>
  );
}
