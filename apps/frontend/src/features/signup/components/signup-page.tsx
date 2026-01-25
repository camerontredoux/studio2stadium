import { AnchoredToastProvider } from "@/components/ui/toast";
import { SignupErrorMessage } from "./signup-error-message";
import { SignupFooter } from "./signup-footer";
import { SignupForm } from "./signup-form";

export function SignupPage() {
  return (
    <div className="animate-fade-in-scale sm:w-sm w-full flex flex-col space-y-4">
      <SignupErrorMessage />
      <AnchoredToastProvider>
        <SignupForm />
      </AnchoredToastProvider>
      <SignupFooter />
    </div>
  );
}
