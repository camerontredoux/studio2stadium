import { Badge } from "@/components/ui/badge";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/components/utils/cn";
import { ChevronUpIcon, InfoIcon } from "lucide-react";
import { useState } from "react";
import { useSkillsByCategory } from "../hooks/use-skills-by-category";
import type { Skill } from "../types";
import { SkillWeightDots } from "./skill-weight-dots";

interface SkillsWeightedListProps {
  className?: string;
  selectedSkills: Map<string, number>;
  onWeightChange: (skillId: string, weight: number | null) => void;
}

export function SkillsWeightedList({
  className,
  selectedSkills,
  onWeightChange,
}: SkillsWeightedListProps) {
  const skillsByCategory = useSkillsByCategory();
  const [isExpanded, setIsExpanded] = useState(false);

  const selectedSet = new Set(selectedSkills.keys());
  const selectedByCategory: Record<string, Skill[]> = {};
  for (const [category, skills] of Object.entries(skillsByCategory)) {
    const selected = skills.filter((s) => selectedSet.has(s.slug));
    if (selected.length > 0) {
      selectedByCategory[category] = selected;
    }
  }

  const categories = Object.keys(selectedByCategory);

  return (
    <Frame
      compact
      className={cn(
        "flex min-h-10 flex-col overflow-hidden",
        "md:w-80",
        className,
      )}
    >
      <FrameHeader
        className="cursor-pointer flex-row items-center justify-between gap-2 max-md:h-12 md:cursor-default"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-1.5">
          <FrameTitle className="hidden md:block">Selected</FrameTitle>
          <span className="text-sm font-medium md:hidden">
            {isExpanded ? "Selected" : "View Selected"}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={<button type="button" className="inline-flex" />}
              >
                <InfoIcon className="text-muted-foreground size-3.5" />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Higher priority = stronger match in dancer recommendations
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="brand" size="sm">
            {selectedSkills.size} Skills
          </Badge>
          <ChevronUpIcon
            className={cn(
              "text-muted-foreground size-4 transition-transform md:hidden",
              isExpanded && "rotate-180",
            )}
          />
        </div>
      </FrameHeader>
      <FramePanel
        side="bottom"
        className={cn(
          "overflow-hidden md:flex-1",
          "md:max-h-none",
          isExpanded && "max-md:h-400",
          !isExpanded && "hidden md:block",
        )}
      >
        {categories.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            No skills selected
          </p>
        ) : (
          <ScrollArea scrollFade className="h-full">
            <div className="flex flex-col gap-3 p-4">
              {categories.map((category) => (
                <div key={category} className="flex flex-col gap-1.5">
                  <span className="text-muted-foreground text-xs font-medium">
                    {category}
                  </span>
                  <div className="flex flex-col">
                    {selectedByCategory[category].map((skill) => (
                      <div
                        key={skill.slug}
                        className="flex items-center justify-between gap-2 py-0.5"
                      >
                        <span className="min-w-0 truncate text-sm">{skill.name}</span>
                        <SkillWeightDots
                          weight={selectedSkills.get(skill.slug) ?? 1}
                          onChange={(weight) =>
                            onWeightChange(skill.slug, weight)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </FramePanel>
    </Frame>
  );
}
