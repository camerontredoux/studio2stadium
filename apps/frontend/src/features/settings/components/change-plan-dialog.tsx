import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Radio, RadioGroup } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { cn } from "@/components/utils/cn";
import { formatDate } from "@/components/utils/format";
import type { components } from "@/lib/api/types";
import { PLAN_NAMES, PREMIUM_OFFERS, type PlanOffer } from "@/lib/plans";
import { useSubscribed } from "@/lib/session/hooks/use-subscribed";
import { sessionQueries } from "@/lib/session/queries";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { InfoIcon, RefreshCwIcon } from "lucide-react";
import { useState } from "react";
import { useChangePlan } from "../api/mutations";
import { accountQueries } from "../api/queries";

type SwitchablePlan = components["schemas"]["SubscriptionPlan"];

const formatMoney = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);

/**
 * "Change plan" on the Membership card: pick another subscription plan, see
 * what it costs today and at renewal, then switch the subscription in place.
 * Access never lapses, and a subscription set to cancel renews again.
 */
export function ChangePlanDialog() {
  const [open, setOpen] = useState(false);
  // Remounts the steps on every open, so each starts from the plan list.
  const [opened, setOpened] = useState(0);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setOpened((count) => count + 1);
      }}
    >
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => {
          setOpen(true);
          setOpened((count) => count + 1);
        }}
      >
        <RefreshCwIcon className="size-4" />
        Change plan
      </Button>
      <DialogPopup className="sm:max-w-lg" data-testid="change-plan-dialog">
        <ChangePlanSteps key={opened} onDone={() => setOpen(false)} />
      </DialogPopup>
    </Dialog>
  );
}

function ChangePlanSteps({ onDone }: { onDone: () => void }) {
  const {
    data: { plan: currentPlan },
  } = useSubscribed();
  const [chosen, setChosen] = useState<SwitchablePlan | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (confirming && chosen) {
    return (
      <ConfirmStep
        plan={chosen}
        onBack={() => setConfirming(false)}
        onDone={onDone}
      />
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Change plan</DialogTitle>
        <DialogDescription>
          Switch plans without cancelling. Your access continues while you
          switch.
        </DialogDescription>
      </DialogHeader>
      <DialogPanel>
        <RadioGroup
          aria-label="Plans"
          value={chosen}
          onValueChange={(value) => setChosen(value as SwitchablePlan)}
        >
          {PREMIUM_OFFERS.map((offer) => (
            <PlanChoice
              key={offer.id}
              offer={offer}
              current={offer.id === currentPlan}
            />
          ))}
        </RadioGroup>
      </DialogPanel>
      <DialogFooter>
        <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
        <Button disabled={!chosen} onClick={() => setConfirming(true)}>
          Continue
        </Button>
      </DialogFooter>
    </>
  );
}

function PlanChoice({
  offer,
  current,
}: {
  offer: PlanOffer;
  current: boolean;
}) {
  return (
    <label
      data-testid={`change-plan-option-${offer.id}`}
      className={cn(
        "bg-card relative flex gap-3 rounded-xl border-2 p-4 transition-colors",
        current
          ? "cursor-default opacity-70"
          : "hover:border-brand/50 has-data-checked:border-brand has-data-checked:bg-brand/10 cursor-pointer",
        "has-focus-visible:ring-ring has-focus-visible:ring-offset-background has-focus-visible:ring-2 has-focus-visible:ring-offset-2",
      )}
    >
      <span className="flex h-7 shrink-0 items-center">
        <Radio value={offer.id} disabled={current} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="flex min-h-7 items-center gap-2 font-semibold">
            {offer.name}
            {current && (
              <Badge variant="outline" className="rounded-full">
                Current plan
              </Badge>
            )}
          </span>
          <span className="text-muted-foreground text-sm whitespace-nowrap">
            <span className="text-primary text-xl font-bold tabular-nums">
              {offer.price}
            </span>{" "}
            {offer.per}
          </span>
        </div>
        <span className="text-muted-foreground text-xs">{offer.note}</span>
      </div>
    </label>
  );
}

function ConfirmStep({
  plan,
  onBack,
  onDone,
}: {
  plan: SwitchablePlan;
  onBack: () => void;
  onDone: () => void;
}) {
  const {
    data: { currentPeriodEnd },
  } = useSubscribed();
  const queryClient = useQueryClient();
  const preview = useQuery(accountQueries.planChange(plan));
  const { mutate, isPending } = useChangePlan();
  const name = PLAN_NAMES[plan];

  const confirm = () => {
    if (!preview.data) return;
    mutate(
      { body: { plan, prorationDate: preview.data.prorationDate } },
      {
        onSuccess: async ({ status, amountPaid, credit, currency }) => {
          queryClient.setQueryData(
            sessionQueries.subscribed().queryKey,
            status,
          );
          // Limits and gated screens were cached under the old plan.
          await queryClient.invalidateQueries();
          toastManager.add({
            title: `You're on the ${PLAN_NAMES[status.plan]} plan`,
            description:
              credit > 0
                ? `${formatMoney(credit, currency)} was credited to your account for your next payments.`
                : amountPaid > 0
                  ? `You were charged ${formatMoney(amountPaid, currency)}.`
                  : undefined,
            type: "success",
          });
          onDone();
        },
        onError: (error) => {
          toastManager.add({
            title: "Your plan didn't change",
            description: error.errors?.[0]?.message ?? error.message,
            type: "error",
          });
          // The amounts may have moved; show fresh ones before a retry.
          void preview.refetch();
        },
      },
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Switch to {name}?</DialogTitle>
        <DialogDescription>
          The switch takes effect now. Your unused time on your current plan
          counts toward the new one.
        </DialogDescription>
      </DialogHeader>
      <DialogPanel>
        {preview.isPending ? (
          <div className="flex items-center justify-center py-10">
            <Spinner />
          </div>
        ) : preview.isError ? (
          <Alert variant="error">
            <InfoIcon />
            <AlertDescription>
              {preview.error.message ?? "Couldn't load the price. Try again."}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="flex flex-col gap-4" data-testid="change-plan-summary">
            <dl className="divide-y rounded-xl border">
              <SummaryRow label="Due today">
                {formatMoney(preview.data.amountDue, preview.data.currency)}
              </SummaryRow>
              {preview.data.paidFromCredit > 0 && (
                <SummaryRow label="Paid from your account credit">
                  {formatMoney(
                    preview.data.paidFromCredit,
                    preview.data.currency,
                  )}
                </SummaryRow>
              )}
              {preview.data.credit > 0 && (
                <SummaryRow label="Credit for later payments">
                  {formatMoney(preview.data.credit, preview.data.currency)}
                </SummaryRow>
              )}
              <SummaryRow
                label={`Then on ${formatDate(preview.data.renewsAt)}`}
              >
                {formatMoney(
                  preview.data.renewalAmount,
                  preview.data.currency,
                )}
              </SummaryRow>
            </dl>
            <p className="text-muted-foreground text-sm">
              {preview.data.terms}
            </p>
            {preview.data.clearsCancellation && (
              <Alert variant="info">
                <InfoIcon />
                <AlertDescription>
                  Your membership is set to cancel on{" "}
                  {formatDate(currentPeriodEnd)}. Switching keeps it, and the
                  new plan renews automatically.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </DialogPanel>
      <DialogFooter>
        <Button variant="ghost" onClick={onBack} disabled={isPending}>
          Back
        </Button>
        <Button
          onClick={confirm}
          disabled={!preview.data || isPending}
          className="gap-2"
        >
          {isPending && <Spinner />}
          {preview.data && preview.data.amountDue > 0
            ? `Pay ${formatMoney(preview.data.amountDue, preview.data.currency)} and switch`
            : `Switch to ${name}`}
        </Button>
      </DialogFooter>
    </>
  );
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-3">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="font-semibold tabular-nums">{children}</dd>
    </div>
  );
}
