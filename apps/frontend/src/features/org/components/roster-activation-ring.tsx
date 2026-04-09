import { cn } from "@/components/utils/cn";

interface RosterActivationRingProps {
  registered: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function RosterActivationRing({
  registered,
  total,
  size = 168,
  strokeWidth = 10,
  className,
}: RosterActivationRingProps) {
  const pct = total > 0 ? Math.round((registered / total) * 100) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, Math.max(0, pct / 100)));

  const label =
    total > 0
      ? `${registered} of ${total} roster members activated, ${pct} percent`
      : "No roster members yet";

  return (
    <div
      className={cn(
        "relative inline-flex flex-col items-center justify-center",
        className,
      )}
      role="img"
      aria-label={label}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--org-primary, var(--color-primary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
        aria-hidden="true"
      >
        <span className="text-4xl font-semibold tabular-nums tracking-tight">
          {pct}
          <span className="text-lg">%</span>
        </span>
        <span className="text-muted-foreground mt-1 text-[11px] font-medium tracking-wide uppercase">
          activated
        </span>
      </div>
    </div>
  );
}
