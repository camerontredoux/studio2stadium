import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { useSkillsByCategory } from "../hooks/use-skills-by-category";
import { SkillWeightDots } from "./skill-weight-dots";

interface SkillsWeightedListProps {
  selectedSkills: Map<string, number>;
  onWeightChange: (skillId: string, weight: number | null) => void;
}

export function SkillsWeightedList({
  selectedSkills,
  onWeightChange,
}: SkillsWeightedListProps) {
  const skillsByCategory = useSkillsByCategory();
  const categories = Object.keys(skillsByCategory);

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="text-muted-foreground flex items-center gap-1.5 px-4 text-xs font-medium">
        <span>Priority</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={<button type="button" className="inline-flex" />}
            >
              <InfoIcon className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Set priority from 1-5 for each skill. Higher priority skills
                will be weighted more heavily when matching dancers.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <ScrollArea scrollFade className="h-full">
        <div className="flex flex-col gap-4 px-4 pb-4">
          {categories.map((category) => (
            <div key={category} className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                {category}
              </span>
              <div className="flex flex-col">
                {skillsByCategory[category].map((skill) => (
                  <div
                    key={skill.slug}
                    className="flex items-center justify-between gap-4 py-1.5"
                  >
                    <span className="text-sm">{skill.name}</span>
                    <SkillWeightDots
                      weight={selectedSkills.get(skill.slug) ?? null}
                      onChange={(weight) => onWeightChange(skill.slug, weight)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
