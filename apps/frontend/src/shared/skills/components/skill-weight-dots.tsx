import { cn } from "@/components/utils/cn";

interface SkillWeightDotsProps {
  weight: number | null;
  onChange: (weight: number | null) => void;
}

export function SkillWeightDots({ weight, onChange }: SkillWeightDotsProps) {
  return (
    <div
      className="flex items-center gap-1.5"
      role="group"
      aria-label="Skill priority"
    >
      {[1, 2, 3, 4, 5].map((dot) => (
        <button
          key={dot}
          type="button"
          onClick={() => onChange(weight === dot ? null : dot)}
          aria-label={`Priority ${dot}`}
          aria-pressed={weight !== null && dot <= weight}
          className={cn(
            "flex size-5 min-h-[44px] min-w-[44px] items-center justify-center",
            "rounded-full transition-colors",
          )}
        >
          <span
            className={cn(
              "block size-3 rounded-full border-2 transition-colors",
              weight !== null && dot <= weight
                ? "border-brand bg-brand"
                : "border-muted-foreground/40 bg-transparent",
            )}
          />
        </button>
      ))}
    </div>
  );
}
