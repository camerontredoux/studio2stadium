import { useRouterState } from "@tanstack/react-router";
import { AuthFooter } from "../shared/auth-footer";
import { ErrorMessage } from "../shared/error-message";
import { MainLogo } from "../shared/main-logo";
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
  "/signup": "Choose your account type",
  "/forgot-password": "Reset your password",
};

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const description =
    descriptions[pathname] || "Sign in to your account to continue";

  return (
    <AnchoredToastProvider>
      <main className="min-h-screen flex flex-col">
        <div className="flex p-2 sm:p-4 flex-col flex-1 items-center justify-center h-full w-full">
          <div className="animate-fade-in-scale sm:w-sm w-full flex flex-col space-y-2 sm:space-y-4">
            <ErrorMessage />

            <Card>
              <CardHeader className="flex flex-col items-center text-center">
                <CardTitle className="p-2">
                  <MainLogo className="h-5 dark:invert" />
                </CardTitle>
                <CardDescription>{description}</CardDescription>
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
