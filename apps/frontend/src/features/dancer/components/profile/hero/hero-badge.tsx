import { cn } from "@/components/utils/cn";

export function HeroBadge({
  label,
  value,
  className,
}: {
  label: string;
  value: string | number | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group flex w-full flex-1 flex-col items-center gap-1 rounded-lg border px-2 py-1 sm:w-20 sm:px-4 sm:py-2",
        className,
      )}
    >
      <span className="text-muted-foreground group-hover:text-brand text-sm">
        {label}
      </span>
      <span className="text-sm">{value ?? "-"}</span>
    </div>
  );
}
