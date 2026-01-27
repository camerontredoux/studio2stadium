import { useLocation } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { ToastProvider } from "../../ui/toast";
import { SideInfo } from "./sidebar/side-info";
import { SideNavbar } from "./sidebar/side-navbar";
import { TopNavbar } from "./topbar/top-navbar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { pathname } = useLocation();

  return (
    <ToastProvider>
      <div className="min-h-svh">
        <TopNavbar />
        <div className="pt-12 max-w-2xl lg:max-w-5xl xl:max-w-7xl mx-auto flex">
          <SideNavbar />
          <main className="flex-1 min-w-0 pl-0 p-2 md:pl-0 md:p-2 xl:py-4">
            {children}
          </main>
          {(pathname === "/" || pathname === "/logout") && <SideInfo />}
        </div>
      </div>
    </ToastProvider>
  );
}
