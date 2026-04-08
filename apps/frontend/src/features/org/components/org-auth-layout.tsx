import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnchoredToastProvider } from "@/components/ui/toast";
import { useOrg } from "@/features/org/context/use-org";
import type { ReactNode } from "react";

export function OrgAuthLayout({
  description,
  children,
}: {
  description?: string;
  children: ReactNode;
}) {
  const { org } = useOrg();

  return (
    <AnchoredToastProvider>
      <main className="flex min-h-svh flex-col">
        <div className="flex h-full w-full flex-1 flex-col items-center justify-center p-2 sm:p-4">
          <div className="flex w-full max-w-sm flex-col space-y-2 sm:space-y-4">
            <Card>
              <CardHeader className="flex flex-col items-center text-center">
                {org.logoUrl && (
                  <img
                    src={org.logoUrl}
                    alt={org.name}
                    className="mb-2 h-12 w-auto"
                  />
                )}
                <CardTitle>{org.name}</CardTitle>
                {description && (
                  <CardDescription>{description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>{children}</CardContent>
            </Card>
          </div>
        </div>
      </main>
    </AnchoredToastProvider>
  );
}
