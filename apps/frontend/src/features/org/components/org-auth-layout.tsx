import { AuthLayout } from "@/components/layouts/auth-layout";
import {
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
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
    <AuthLayout
      cardHeader={
        <>
          {org.logoUrl ? (
            <img
              src={org.logoUrl}
              alt={org.name}
              className="h-auto max-h-20 w-auto"
            />
          ) : (
            <CardTitle>{org.name}</CardTitle>
          )}
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
        </>
      }
    >
      {children}
    </AuthLayout>
  );
}
