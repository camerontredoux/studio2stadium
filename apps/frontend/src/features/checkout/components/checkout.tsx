import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckoutDialog } from "./checkout-dialog";
import { ChoosePlan } from "./choose-plan";
import { PlanDetails } from "./plan-details";

export function Checkout() {
  const session = useSession();

  const [plan, setPlan] = useState<"basic" | "premium">("premium");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly" | null>(
    null,
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-2">
      <h1 className="text-center text-2xl font-bold tracking-tight">
        Choose Your Plan
      </h1>
      <p className="text-muted-foreground text-center">
        Be Seen. Be Remembered. Be Recruited.
      </p>
      <ChoosePlan plan={plan} onPlanChange={setPlan} />
      <PlanDetails
        plan={plan}
        billingCycle={billingCycle}
        setBillingCycle={setBillingCycle}
      />
      {plan === "basic" ? (
        <Button
          size="lg"
          render={
            <Link to="/$username" params={{ username: session.username }} />
          }
        >
          Continue
        </Button>
      ) : (
        <CheckoutDialog key={billingCycle} billingCycle={billingCycle} />
      )}
    </div>
  );
}
