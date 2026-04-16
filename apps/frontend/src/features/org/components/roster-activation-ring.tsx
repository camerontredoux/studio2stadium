import { cn } from "@/components/utils/cn";

interface RosterActivationRingProps {
  registered: number;
  total: number;
  className?: string;
}

export function RosterActivationRing({
  registered,
  total,
  className,
}: RosterActivationRingProps) {
  const pct = total > 0 ? Math.round((registered / total) * 100) : 0;
  const clampedPct = Math.min(100, Math.max(0, pct));

  const label =
    total > 0
      ? `${registered} of ${total} roster members activated, ${pct} percent`
      : "No roster members yet";

  return (
    <div
      className={cn(
        "bg-background/70 border-border/70 inline-flex w-full flex-col gap-2 rounded-xl border p-4 backdrop-blur-sm",
        className,
      )}
      role="img"
      aria-label={label}
    >
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
            Activation
          </span>
          <span className="text-foreground text-3xl leading-none font-semibold tracking-tight tabular-nums">
            {clampedPct}
            <span className="text-base">%</span>
          </span>
        </div>
        <span className="text-muted-foreground text-sm font-medium tabular-nums">
          {registered}/{total}
        </span>
      </div>
      <div className="bg-muted h-2.5 w-full overflow-hidden rounded-full">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${clampedPct}%`,
            background:
              "linear-gradient(to right, var(--org-primary, var(--color-primary)), var(--org-accent, var(--color-primary)))",
          }}
        />
      </div>
      <p className="text-muted-foreground text-xs">Roster members activated</p>
    </div>
  );
}
