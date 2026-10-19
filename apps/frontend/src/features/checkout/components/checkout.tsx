import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast-manager";
import { handleApiError } from "@/lib/api/errors";
import { queries, useSession } from "@/lib/session";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useDevGrant } from "../api/mutations";
import { CheckoutDialog } from "./checkout-dialog";
import { ChoosePlan } from "./choose-plan";
import { PlanDetails } from "./plan-details";

export function Checkout() {
  const session = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [plan, setPlan] = useState<"basic" | "premium">("premium");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly" | null>(
    "yearly",
  );

  const devGrant = useDevGrant();

  function handleDevGrant() {
    devGrant.mutate(
      {},
      {
        // Refresh the subscription first, so premium screens don't still
        // show the dancer as unsubscribed.
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: queries.subscribed().queryKey,
          });
          navigate({
            to: "/$username",
            params: { username: session.username },
          });
        },
        onError: handleApiError({
          onError: (error) => {
            toastManager.add({
              title: "Error",
              description: error.message,
              type: "error",
            });
          },
        }),
      },
    );
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
            disabled={devGrant.isPending}
            onClick={handleDevGrant}
          >
            {devGrant.isPending ? "Granting..." : "Grant Premium (1 year)"}
          </Button>
        </div>
      )}
    </div>
  );
}
