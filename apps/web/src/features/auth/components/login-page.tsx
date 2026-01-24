import { AnchoredToastProvider } from "@/components/ui/toast";
import { LoginErrorMessage } from "./login-error-message";
import { LoginFooter } from "./login-footer";
import { LoginForm } from "./login-form";

export function LoginPage() {
  return (
    <div className="animate-fade-in-scale sm:w-sm w-full flex flex-col space-y-4">
      <LoginErrorMessage />
      <AnchoredToastProvider>
        <LoginForm />
      </AnchoredToastProvider>
      <LoginFooter />
    </div>
  );
}
