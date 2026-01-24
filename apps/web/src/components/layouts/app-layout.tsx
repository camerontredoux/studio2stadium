import { useSession } from "@/features/auth/api/queries";
import { type ReactNode } from "react";
import { ToastProvider } from "../ui/toast";
import { DancerNavItems, SchoolNavItems } from "./navbar/nav-items";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { session } = useSession();

  return (
    <ToastProvider>
      <div className="max-w-7xl mx-auto">
        {session.type === "dancer" ? <DancerNavItems /> : <SchoolNavItems />}
        {children}
      </div>
    </ToastProvider>
  );
}
