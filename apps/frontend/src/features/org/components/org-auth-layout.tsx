import { AnchoredToastProvider } from "@/components/ui/toast";
import type { ReactNode } from "react";

export function OrgAuthLayout({ children }: { children: ReactNode }) {
  return (
    <AnchoredToastProvider>
      <main className="flex min-h-svh flex-col">
        <div className="flex h-full w-full flex-1 flex-col items-center justify-center p-2 sm:p-4">
          {children}
        </div>
      </main>
    </AnchoredToastProvider>
  );
}
