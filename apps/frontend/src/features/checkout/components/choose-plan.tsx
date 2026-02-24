import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/utils/cn";

interface ChoosePlanProps {
  plan: "basic" | "premium";
  onPlanChange: (plan: "basic" | "premium") => void;
}

export function ChoosePlan({ plan, onPlanChange }: ChoosePlanProps) {
  return (
    <div className="mt-2 flex w-full flex-row items-center justify-center gap-2">
      <Button
        className={cn(
          "h-14! w-full flex-1 border-2",
          plan === "basic" && "bg-brand/20! border-brand!",
        )}
        variant="outline"
        size="lg"
        onClick={() => onPlanChange("basic")}
      >
        Basic
      </Button>
      <Button
        className={cn(
          "relative h-14! w-full flex-1 border-2",
          plan === "premium" && "bg-brand/20! border-brand!",
        )}
        variant="outline"
        size="lg"
        onClick={() => onPlanChange("premium")}
      >
        <div className="absolute -top-2 flex items-center justify-center">
          <Badge
            className={cn(
              "bg-brand uppercase",
              plan === "basic" &&
                "bg-[#e3e3e3] text-black dark:bg-[#3c3c3e] dark:text-white",
            )}
          >
            Popular
          </Badge>
        </div>
        Premium
      </Button>
    </div>
  );
}
