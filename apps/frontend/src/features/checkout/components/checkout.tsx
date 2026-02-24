import { useCheckout } from "../api/mutations";

import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast-manager";
import { useSession } from "@/lib/session";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChoosePlan } from "./choose-plan";
import { PlanDetails } from "./plan-details";

const stripe = loadStripe(import.meta.env.VITE_STRIPE_KEY);

export function Checkout() {
  const session = useSession();

  const { mutate, isPending, data } = useCheckout();

  const [plan, setPlan] = useState<"basic" | "premium">("premium");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly" | null>(
    null,
  );

  const handleCheckout = () => {
    if (!billingCycle) {
      toastManager.add({
        type: "error",
        title: "Error",
        description: "Please select a billing cycle",
      });
      return;
    }

    mutate({
      body: {
        type: billingCycle,
      },
    });
  };

  if (!data) {
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
        <Button
          size="lg"
          onClick={plan === "premium" ? handleCheckout : undefined}
          disabled={isPending || (plan === "premium" && !billingCycle)}
          render={
            plan === "basic" ? (
              <Link to="/$username" params={{ username: session.username }} />
            ) : undefined
          }
        >
          Continue
        </Button>
      </div>
    );
  }

  return (
    <EmbeddedCheckoutProvider
      stripe={stripe}
      options={{ clientSecret: data.clientSecret }}
    >
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
}
