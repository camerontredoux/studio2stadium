import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { formatDate } from "@/components/utils/format";
import { handleApiError, toastApiError } from "@/lib/api/errors";
import { PAID_OFFERS, PLAN_NAMES } from "@/lib/plans";
import { useSubscribed } from "@/lib/session/hooks/use-subscribed";
import { sessionQueries } from "@/lib/session/queries";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertTriangleIcon,
  CheckIcon,
  CreditCardIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { useConfirmCheckout, useManage } from "../api/mutations";

const HERO_FEATURES = {
  premium: [
    { label: "Full access", included: true },
    { label: "Exclusive content", included: true },
    { label: "Show Interest", included: true },
  ],
  pass: [
    { label: "Recruiting access", included: true },
    { label: "Up to 5 programs", included: true },
    { label: "Show Interest", included: false },
    { label: "Common Recruit", included: false },
  ],
  free: [
    { label: "Full access", included: false },
    { label: "Exclusive content", included: false },
    { label: "Training videos", included: false },
  ],
};

const HERO_TEXT = {
  premium:
    "You have full access to all premium features and exclusive content.",
  pass: "Your 1-Week Pass gives you seven days of recruiting access with a smaller portfolio and program list.",
  free: "You don't have access to any premium features. Upgrade to get full access.",
};

export function MembershipSettings() {
  const {
    data: {
      access,
      plan,
      source,
      cancelAtPeriodEnd,
      currentPeriodEnd,
      subscribed,
      paymentFailed,
    },
  } = useSubscribed();

  const navigate = useNavigate();
  const { mutate, isPending } = useManage();
  useConfirmReturnFromCheckout();

  const price = PAID_OFFERS.find((offer) => offer.id === plan);
  const onSubscription = source === "stripe";
  // A failed renewal keeps access for a few days, and the billing portal is
  // where the member fixes their card, before or after access ends.
  const canManageBilling = onSubscription || paymentFailed;

  const handleManage = () => {
    mutate(
      {},
      {
        onSuccess: (data) => {
          // Without a Stripe subscription the backend redirects this request
          // to /checkout, which arrives here as a success with no url.
          if (!data?.url) {
            toastManager.add({
              title: "Error",
              description: "Couldn't open billing. Please try again later.",
              type: "error",
            });
            return;
          }
          window.location.href = data.url;
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
  };

  return (
    <Frame>
      <FrameHeader>
        <FrameTitle className="flex items-center gap-2">
          Membership
          <Badge
            variant={subscribed ? "success" : "error"}
            className="ml-auto rounded-full"
          >
            <span className="relative flex size-1.5">
              <span
                className={`absolute size-full animate-ping rounded-full ${subscribed ? "bg-emerald-500" : "bg-red-500"}`}
              />
              <span
                className={`relative size-1.5 rounded-full ${subscribed ? "bg-emerald-500" : "bg-red-500"}`}
              />
            </span>
            {subscribed ? "Active" : "Inactive"}
          </Badge>
        </FrameTitle>
      </FrameHeader>

      <FramePanel className="flex flex-col gap-5">
        {/* Hero image */}
        <div className="relative h-52 overflow-hidden rounded-xl">
          <div
            className="absolute inset-0 bg-cover bg-right"
            style={{
              backgroundImage: `url('https://studio2stadium.com/_astro/partners.DL9k8Vh1_1wBFw5.webp')`,
            }}
          />
          <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/60 to-black/40" />

          <div className="relative flex h-full flex-col justify-center p-5 text-white sm:p-6">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Keep dancing, reach for the stars
            </h2>
            <p className="mt-1.5 max-w-lg text-sm text-white/70 sm:text-base">
              {HERO_TEXT[access]}
            </p>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5">
              {HERO_FEATURES[access].map(({ label, included }) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  {included ? (
                    <CheckIcon className="text-brand size-4" />
                  ) : (
                    <XIcon className="text-muted-foreground size-4" />
                  )}
                  <span className="text-white/90">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {paymentFailed && (
          <div
            role="alert"
            className="border-destructive-foreground/30 bg-destructive/5 flex items-start gap-3 rounded-xl border p-4 text-sm"
          >
            <AlertTriangleIcon className="text-destructive-foreground mt-0.5 size-4 shrink-0" />
            <p>
              Your last payment didn&apos;t go through.{" "}
              {subscribed && currentPeriodEnd ? (
                <>
                  Update your card to keep your plan. Access ends on{" "}
                  <span className="font-semibold tabular-nums">
                    {formatDate(currentPeriodEnd)}
                  </span>{" "}
                  if the payment still fails.
                </>
              ) : (
                "Your access has ended. Update your card to restore it."
              )}
            </p>
          </div>
        )}

        <Card
          className={
            paymentFailed || (onSubscription && cancelAtPeriodEnd)
              ? "border-destructive-foreground/30 bg-destructive/2"
              : access !== "premium"
                ? "border-brand/30 bg-brand/5"
                : ""
          }
        >
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-8">
              <PlanFact label="Current plan">
                {PLAN_NAMES[plan]}
                {price && (
                  <span className="text-muted-foreground text-sm font-normal">
                    {" "}
                    · {price.price}
                    {price.per}
                  </span>
                )}
              </PlanFact>
              {subscribed && currentPeriodEnd && (
                <PlanFact
                  label={
                    onSubscription
                      ? paymentFailed
                        ? "Access ends on"
                        : cancelAtPeriodEnd
                          ? "Cancels on"
                          : "Renews on"
                      : source === "week_pass"
                        ? "Expires on"
                        : "Access until"
                  }
                >
                  <span className="tabular-nums">
                    {formatDate(currentPeriodEnd)}
                  </span>
                </PlanFact>
              )}
              {!subscribed && (
                <span className="text-muted-foreground max-w-xs text-sm">
                  Get access to exclusive content, training videos, and more.
                </span>
              )}
            </div>

            {canManageBilling ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManage}
                disabled={isPending}
                className="gap-2"
              >
                {isPending ? (
                  <Spinner />
                ) : (
                  <CreditCardIcon className="size-4" />
                )}
                {paymentFailed ? "Update payment" : "Manage billing"}
              </Button>
            ) : (
              access !== "premium" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate({ to: "/checkout" })}
                  className="gap-2"
                >
                  <CreditCardIcon className="size-4" />
                  {access === "pass" ? "Add a week or upgrade" : "See plans"}
                </Button>
              )
            )}
          </CardContent>
          {onSubscription && price && !cancelAtPeriodEnd && (
            <CardFooter className="text-muted-foreground border-t text-sm">
              {price.billing}
            </CardFooter>
          )}
        </Card>
      </FramePanel>
    </Frame>
  );
}

function PlanFact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
        {label}
      </span>
      <span className="text-base font-semibold">{children}</span>
    </div>
  );
}

/**
 * Stripe Checkout returns here with `?session_id=`. Confirm the session so the
 * new plan shows at once instead of after the webhook, then drop the param.
 */
function useConfirmReturnFromCheckout() {
  const { session_id } = useSearch({
    from: "/_app/(routes)/settings/membership",
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate } = useConfirmCheckout();
  // StrictMode runs effects twice in development; confirm once.
  const confirmed = useRef<string | null>(null);

  useEffect(() => {
    if (!session_id || confirmed.current === session_id) return;
    confirmed.current = session_id;

    mutate(
      { body: { sessionId: session_id } },
      {
        onSuccess: async (status) => {
          queryClient.setQueryData(
            sessionQueries.subscribed().queryKey,
            status,
          );
          // Limits and gated screens were cached under the old plan.
          await queryClient.invalidateQueries();
          if (status.subscribed) {
            toastManager.add({
              title: `You're on the ${PLAN_NAMES[status.plan]} plan`,
              type: "success",
            });
          }
        },
        onError: toastApiError,
        onSettled: () => {
          navigate({
            to: "/settings/membership",
            search: {},
            replace: true,
          });
        },
      },
    );
  }, [session_id, mutate, navigate, queryClient]);
}
