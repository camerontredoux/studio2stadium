import {
  PAID_OFFERS,
  PREMIUM_FEATURES,
  WEEK_PASS_EXCLUDED,
  WEEK_PASS_FEATURES,
  type PaidPlan,
} from "@/lib/plans";
import { CheckIcon, XIcon } from "lucide-react";

export function PlanDetails({ plan }: { plan: PaidPlan }) {
  const isWeekPass = plan === "week_pass";
  const name = PAID_OFFERS.find((offer) => offer.id === plan)?.name;

  return (
    <div className="bg-muted/40 flex flex-col gap-3 rounded-xl p-4">
      <p className="text-sm font-medium">
        {isWeekPass
          ? `What's in the ${name}`
          : `${name} includes every Premium feature`}
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {(isWeekPass ? WEEK_PASS_FEATURES : PREMIUM_FEATURES).map((label) => (
          <li key={label} className="flex items-start gap-2 text-sm">
            <CheckIcon className="text-brand mt-0.5 size-4 shrink-0" />
            {label}
          </li>
        ))}
        {isWeekPass &&
          WEEK_PASS_EXCLUDED.map((label) => (
            <li
              key={label}
              className="text-muted-foreground flex items-start gap-2 text-sm"
            >
              <XIcon className="mt-0.5 size-4 shrink-0" />
              {label}
            </li>
          ))}
      </ul>
    </div>
  );
}
