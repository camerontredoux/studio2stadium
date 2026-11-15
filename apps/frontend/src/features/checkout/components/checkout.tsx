import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast-manager";
import { formatDate } from "@/components/utils/format";
import { handleApiError } from "@/lib/api/errors";
import { PAID_OFFERS, type PaidPlan } from "@/lib/plans";
import { queries, useSession } from "@/lib/session";
import { useSubscribed } from "@/lib/session/hooks/use-subscribed";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { TimerIcon } from "lucide-react";
import { useState } from "react";
import { useDevGrant } from "../api/mutations";
import { CheckoutDialog } from "./checkout-dialog";
import { ChoosePlan } from "./choose-plan";
import { PlanDetails } from "./plan-details";

export function Checkout() {
  const session = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    data: { access, currentPeriodEnd, upgradeFirstChargeAt },
  } = useSubscribed();

  const [plan, setPlan] = useState<PaidPlan>("annual");
  const offer = PAID_OFFERS.find((o) => o.id === plan)!;

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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-2">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Choose Your Plan</h1>
        <p className="text-muted-foreground">
          Be Seen. Be Remembered. Be Recruited.
        </p>
      </div>

      {access === "pass" && (
        <div className="border-brand/30 bg-brand/5 flex items-start gap-3 rounded-xl border p-4 text-sm">
          <TimerIcon className="text-brand mt-0.5 size-4 shrink-0" />
          <p>
            Your 1-Week Pass runs until{" "}
            <span className="font-semibold">
              {formatDate(currentPeriodEnd)}
            </span>
            . Buy another to add seven more days, or upgrade and your
            remaining pass days are credited toward the new plan.
          </p>
        </div>
      )}

      <ChoosePlan plan={plan} onPlanChange={setPlan} />
      <PlanDetails plan={plan} />
      <BillingDisclosure
        plan={plan}
        creditedUntil={access === "pass" ? upgradeFirstChargeAt : null}
      />

      <div className="flex flex-col gap-2">
        <CheckoutDialog key={plan} plan={plan} label={offer.cta} />
        {access === "free" && (
          <Button
            variant="ghost"
            render={
              <Link to="/$username" params={{ username: session.username }} />
            }
          >
            Continue with a Free Profile
          </Button>
        )}
      </div>

      {import.meta.env.DEV && (
        <div className="border-destructive/30 bg-destructive/5 mt-4 flex flex-col gap-2 rounded-lg border border-dashed p-4">
          <p className="text-destructive text-xs font-semibold tracking-wider uppercase">
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

/**
 * The charge and renewal terms, shown before the Dancer opens Stripe
 * Checkout. A Week Pass holder upgrading is not charged until their pass
 * days run out.
 */
function BillingDisclosure({
  plan,
  creditedUntil,
}: {
  plan: PaidPlan;
  creditedUntil: string | null;
}) {
  const offer = PAID_OFFERS.find((o) => o.id === plan)!;
  const credited = plan !== "week_pass" && creditedUntil;

  return (
    <div className="flex flex-col gap-1 text-center text-sm">
      {credited && (
        <p className="font-medium">
          Your 1-Week Pass days are credited. You pay nothing today; your first
          charge is on{" "}
          <span className="tabular-nums">{formatDate(creditedUntil)}</span>.
        </p>
      )}
      <p className="text-muted-foreground">{offer.billing}</p>
    </div>
  );
}
