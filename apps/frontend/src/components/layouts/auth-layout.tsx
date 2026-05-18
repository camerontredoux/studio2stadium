import { useRouterState } from "@tanstack/react-router";
import { AuthFooter } from "../shared/auth-footer";
import { MainLogo } from "../shared/main-logo";
import { RedirectMessage } from "../shared/redirect-message";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { AnchoredToastProvider } from "../ui/toast";

const descriptions: Record<string, string> = {
  "/login": "Sign in to your account to continue",
  "/orgs": "Choose your organization to sign in",
};

type AuthLayoutProps = {
  children: React.ReactNode;
  /** When set, replaces the default main logo and pathname-based description. */
  cardHeader?: React.ReactNode;
};

export function AuthLayout({ children, cardHeader }: AuthLayoutProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const description = descriptions[pathname];

  const defaultCardHeader = (
    <>
      <CardTitle className="p-2">
        <MainLogo className="h-5 dark:invert" />
      </CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </>
  );

  return (
    <AnchoredToastProvider>
      <main className="flex min-h-svh flex-col">
        <div className="flex h-full w-full flex-1 flex-col items-center justify-center p-2 sm:p-4">
          <div className="flex w-full max-w-sm flex-col space-y-2 sm:space-y-4">
            <RedirectMessage />

            <Card>
              <CardHeader className="flex flex-col items-center text-center">
                {cardHeader ?? defaultCardHeader}
              </CardHeader>

              <CardContent>{children}</CardContent>
            </Card>

            <AuthFooter />
          </div>
        </div>
      </main>
    </AnchoredToastProvider>
  );
}
