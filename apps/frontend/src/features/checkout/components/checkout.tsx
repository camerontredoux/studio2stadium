import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckoutDialog } from "./checkout-dialog";
import { ChoosePlan } from "./choose-plan";
import { PlanDetails } from "./plan-details";

export function Checkout() {
  const session = useSession();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<"basic" | "premium">("premium");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly" | null>(
    null,
  );

  const [granting, setGranting] = useState(false);

  async function handleDevGrant() {
    setGranting(true);
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/subscriptions/dev-grant`, {
        method: "POST",
        credentials: "include",
      });
      navigate({
        to: "/$username",
        params: { username: session.username },
      });
    } finally {
      setGranting(false);
    }
  }

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
      {import.meta.env.DEV && (
        <div className="border-destructive/30 bg-destructive/5 mt-4 flex flex-col gap-2 rounded-lg border border-dashed p-4">
          <p className="text-destructive text-xs font-semibold uppercase tracking-wider">
            Dev Only
          </p>
          <Button
            variant="destructive"
            size="sm"
            disabled={granting}
            onClick={handleDevGrant}
          >
            {granting ? "Granting..." : "Grant Premium (1 year)"}
          </Button>
        </div>
      )}
    </div>
  );
}
