import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Spinner } from "@/components/ui/spinner";
import { formatDate } from "@/components/utils/format";
import { useSubscribed } from "@/lib/session/hooks/use-subscribed";
import { useNavigate } from "@tanstack/react-router";
import { CheckIcon, CreditCardIcon, XIcon } from "lucide-react";
import { useManage } from "../api/mutations";

export function MembershipSettings() {
  const {
    cancelAtPeriodEnd,
    currentPeriodEnd,
    subscribed: subbed,
  } = useSubscribed();

  const subscribed = subbed;

  const navigate = useNavigate();

  const { mutateAsync, isPending } = useManage();

  const handleManage = async () => {
    if (subscribed) {
      await mutateAsync({}).then((data) => (window.location.href = data.url));
    } else {
      navigate({ to: "/checkout" });
    }
  };

  return (
    <Frame>
      <FrameHeader>
        <FrameTitle className="flex items-center gap-2">
          Premium Membership
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
              backgroundImage: `url('https://marketing.studio2stadium.com/_astro/partners.DL9k8Vh1_1wBFw5.webp')`,
            }}
          />
          <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/60 to-black/40" />

          <div className="relative flex h-full flex-col justify-center p-5 text-white sm:p-6">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Keep dancing, reach for the stars
            </h2>
            <p className="mt-1.5 max-w-lg text-sm text-white/70 sm:text-base">
              {subscribed
                ? "You have full access to all premium features, exclusive content, and priority support."
                : "You don't have access to any premium features. Upgrade to get full access."}
            </p>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5">
              {["Full access", "Exclusive content", "Priority support"].map(
                (feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 text-sm"
                  >
                    {subscribed ? (
                      <CheckIcon className="text-brand size-4" />
                    ) : (
                      <XIcon className="text-muted-foreground size-4" />
                    )}
                    <span className="text-white/90">{feature}</span>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        <Card
          className={
            subscribed && cancelAtPeriodEnd
              ? "border-destructive-foreground/30 bg-destructive/2"
              : !subscribed
                ? "border-brand/30 bg-brand/5"
                : ""
          }
        >
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-0.5">
              {subscribed ? (
                <>
                  <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                    {cancelAtPeriodEnd ? "Cancels on" : "Next billing date"}
                  </span>
                  <span className="text-base font-semibold tabular-nums">
                    {formatDate(currentPeriodEnd)}
                  </span>
                </>
              ) : (
                <>
                  <span className="font-medium">Ready to upgrade?</span>
                  <span className="text-muted-foreground text-sm">
                    Get access to exclusive content, priority support, and more.
                  </span>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleManage}
              disabled={isPending}
              className="gap-2"
            >
              {isPending ? <Spinner /> : <CreditCardIcon className="size-4" />}
              {subscribed ? "Manage billing" : "Subscribe"}
            </Button>
          </CardContent>
        </Card>
      </FramePanel>
    </Frame>
  );
}
