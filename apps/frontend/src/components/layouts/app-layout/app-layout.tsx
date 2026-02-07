import { type ReactNode } from "react";
import { Navbar } from "./navbar/navbar";
import { Topbar } from "./topbar/topbar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-svh">
      <Topbar />
      <div className="mx-auto flex max-w-2xl pt-12 lg:max-w-5xl xl:max-w-7xl">
        <Navbar />
        <main className="min-w-0 flex-1 p-2 lg:p-4">{children}</main>
      </div>
    </div>
  );
}
