import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { SparklesIcon } from "lucide-react";

/**
 * Dancer-facing promo for the Dancer Spotlight placement, shown on the
 * For You feed above the Program Spotlight. Drives to the My Spotlights page
 * where the dancer can send one.
 */
export function SpotlightAd() {
  return (
    <div className="border-brand/40 from-brand/10 via-brand/5 to-background relative overflow-clip rounded-2xl border bg-linear-to-br p-4">
      <SparklesIcon className="text-brand/10 pointer-events-none absolute -top-6 -left-6 size-36 rotate-12" />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-semibold">Your Profile. Front and Center.</h2>
          <p className="text-muted-foreground text-sm">
            Feature your profile in your chosen program's Dancer Spotlights for 7 days, giving coaches more opportunities to explore your profile.
          </p>
        </div>
        <Button
          className="bg-brand border-brand-border shadow-brand/24 hover:bg-brand-hover shrink-0 text-white max-sm:w-full"
          render={<Link to="/recruiting/my-spotlights" />}
        >
          Send a Spotlight
        </Button>
      </div>
    </div>
  );
}
