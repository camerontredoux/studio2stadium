import { cn } from "@/components/utils/cn";

interface SkillWeightDotsProps {
  weight: number | null;
  onChange: (weight: number | null) => void;
}

export function SkillWeightDots({ weight, onChange }: SkillWeightDotsProps) {
  return (
    <div
      className="flex shrink-0 items-center"
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
          className="flex size-7 items-center justify-center"
        >
          <span
            className={cn(
              "block size-2.5 rounded-full border-[1.5px] transition-colors",
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
