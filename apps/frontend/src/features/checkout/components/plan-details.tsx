import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/utils/cn";
import { CheckIcon } from "lucide-react";

interface PlanDetailsProps {
  plan: "basic" | "premium";
  billingCycle: "monthly" | "yearly" | null;
  setBillingCycle: (billingCycle: "monthly" | "yearly" | null) => void;
}

export function PlanDetails({
  plan,
  billingCycle,
  setBillingCycle,
}: PlanDetailsProps) {
  if (plan === "basic") {
    return (
      <div className="flex flex-col gap-3">
        <ul className="space-y-2 p-2">
          <PlanDetailsItem label="Digital Resume & Portfolio" />
          <PlanDetailsItem label="Coaches can find and view your profile" />
          <PlanDetailsItem label="Upload 4 photos, no videos" />
          <PlanDetailsItem label="Unlimited access to blogs" />
        </ul>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="space-y-2 p-2">
        <PlanDetailsItem label="Secure digital portfolio to showcase your talent" />
        <PlanDetailsItem label="Explore programs that fit you best" />
        <PlanDetailsItem label="Track interest and engagement" />
        <PlanDetailsItem label="Stay organized with the event listings" />
        <PlanDetailsItem label="Smart notifications for profile views, favorites, new resources, and new events" />
      </ul>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Choose your billing cycle:</p>
        <div className="flex gap-2">
          <Button
            className={cn(
              "relative h-fit! flex-1 border-2 py-4!",
              billingCycle === "yearly" && "bg-brand/10! border-brand!",
            )}
            variant="outline"
            size="lg"
            onClick={() => setBillingCycle("yearly")}
          >
            <div className="absolute -top-2 flex items-center justify-center">
              <Badge
                className={cn(
                  "bg-brand uppercase",
                  billingCycle === "monthly" &&
                    "bg-[#e3e3e3] text-black dark:bg-[#3c3c3e] dark:text-white",
                )}
              >
                Save $50
              </Badge>
            </div>
            <div className="flex w-full flex-col items-start">
              <p className="text-muted-foreground text-sm font-light">Yearly</p>
              <p className="text-muted-foreground text-sm">
                <span className="text-primary text-lg font-semibold">
                  $20.83
                </span>
                /mo
              </p>
              <p className="text-muted-foreground text-xs font-light">
                Billed at $250/yr
              </p>
            </div>
          </Button>
          <Button
            className={cn(
              "relative h-fit! flex-1 border-2 py-4!",
              billingCycle === "monthly" && "bg-brand/10! border-brand!",
            )}
            variant="outline"
            size="lg"
            onClick={() => setBillingCycle("monthly")}
          >
            <div className="flex w-full flex-col items-start">
              <p className="text-muted-foreground text-sm font-light">
                Monthly
              </p>
              <p className="text-muted-foreground text-sm">
                <span className="text-primary text-lg font-semibold">$25</span>
                /mo
              </p>
              <p className="text-muted-foreground text-xs font-light">
                Billed monthly
              </p>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}

function PlanDetailsItem({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <CheckIcon className="text-brand size-4 shrink-0" /> {label}
    </li>
  );
}
