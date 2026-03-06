import { Button } from "@/components/ui/button";
import { cn } from "@/components/utils/cn";
import type { Skill } from "../types";

interface SkillsByCategoryProps {
  skills: Skill[];
  selectedSkillIds: string[];
  onToggle: (skillId: string) => void;
}

export function SkillsByCategory({
  skills,
  selectedSkillIds,
  onToggle,
}: SkillsByCategoryProps) {
  const selectedSet = new Set(selectedSkillIds);

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => {
        const isSelected = selectedSet.has(skill.slug);
        return (
          <Button
            key={skill.slug}
            onClick={() => onToggle(skill.slug)}
            variant="outline"
            className={cn(
              "rounded-full before:rounded-full",
              isSelected ? "border-brand bg-brand! text-white" : "",
            )}
          >
            {skill.name}
          </Button>
        );
      })}
    </div>
  );
}
