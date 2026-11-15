import { Badge } from "@/components/ui/badge";
import { Radio, RadioGroup } from "@/components/ui/radio-group";
import { cn } from "@/components/utils/cn";
import {
  PREMIUM_OFFERS,
  WEEK_PASS_OFFER,
  type PaidPlan,
  type PlanOffer,
} from "@/lib/plans";

interface ChoosePlanProps {
  plan: PaidPlan;
  onPlanChange: (plan: PaidPlan) => void;
}

export function ChoosePlan({ plan, onPlanChange }: ChoosePlanProps) {
  return (
    <RadioGroup
      aria-label="Plan"
      value={plan}
      onValueChange={(value) => onPlanChange(value as PaidPlan)}
      className="gap-6"
    >
      <section className="flex flex-col gap-3">
        <SectionHeading
          eyebrow="S2S Premium"
          title="Full access. Your timeline."
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {PREMIUM_OFFERS.map((offer) => (
            <PlanOption key={offer.id} offer={offer} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeading
          eyebrow={WEEK_PASS_OFFER.eyebrow}
          title="Explore for seven days."
        />
        <PlanOption offer={WEEK_PASS_OFFER} wide />
      </section>
    </RadioGroup>
  );
}

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-brand text-xs font-medium tracking-[0.2em] uppercase">
        {eyebrow}
      </p>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
    </div>
  );
}

/**
 * One plan card. The whole card is the radio's label, so a tap anywhere on it
 * selects the plan. Narrow screens put the price beside the name; the
 * three-across Premium cards stack them.
 */
function PlanOption({
  offer,
  wide = false,
}: {
  offer: PlanOffer;
  wide?: boolean;
}) {
  return (
    <label
      className={cn(
        "bg-card relative flex cursor-pointer gap-3 rounded-xl border-2 p-4 transition-colors",
        "hover:border-brand/50 has-data-checked:border-brand has-data-checked:bg-brand/10",
        "has-focus-visible:ring-ring has-focus-visible:ring-offset-background has-focus-visible:ring-2 has-focus-visible:ring-offset-2",
      )}
    >
      {offer.badge && (
        <Badge className="bg-brand absolute -top-2.5 right-3 uppercase">
          {offer.badge}
        </Badge>
      )}
      <Radio value={offer.id} className="mt-0.5" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-brand text-[0.65rem] font-medium tracking-[0.18em] uppercase">
          {offer.eyebrow}
        </span>
        <div
          className={cn(
            "flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1",
            !wide && "sm:flex-col sm:items-start",
          )}
        >
          <span className="font-semibold">{offer.name}</span>
          <span className="text-muted-foreground text-sm whitespace-nowrap">
            <span className="text-primary text-2xl font-bold tabular-nums">
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
