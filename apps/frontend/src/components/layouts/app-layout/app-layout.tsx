import { type ReactNode } from "react";
import { Sidebar } from "./sidebar/sidebar";
import { TopNavbar } from "./topbar/top-navbar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-svh">
      <TopNavbar />
      <div className="pt-12 max-w-2xl lg:max-w-5xl xl:max-w-7xl mx-auto flex">
        <Sidebar />
        <main className="flex-1 min-w-0 p-2 lg:p-4">{children}</main>
      </div>
    </div>
  );
}
