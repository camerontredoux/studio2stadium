import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/components/utils/cn";
import { ChevronUpIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useSkillsByCategory } from "../hooks/use-skills-by-category";
import type { Skill } from "../types";

interface SkillsSummaryProps {
  className?: string;
  selectedSkillIds: string[];
  onRemove: (skillId: string) => void;
}

export function SkillsSummary({
  className,
  selectedSkillIds,
  onRemove,
}: SkillsSummaryProps) {
  const skillsByCategory = useSkillsByCategory();

  const [isExpanded, setIsExpanded] = useState(false);

  const selectedSet = new Set(selectedSkillIds);
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
        <FrameTitle className="hidden md:block">Selected</FrameTitle>
        <span className="text-sm font-medium md:hidden">
          {isExpanded ? "Selected" : "View Selected"}
        </span>
        <div className="flex items-center gap-2">
          <Badge variant="brand" size="sm">
            {selectedSkillIds.length} Skills
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
                  <div className="flex flex-wrap gap-1.5">
                    {selectedByCategory[category].map((skill) => (
                      <Button
                        key={skill.slug}
                        variant="outline"
                        size="xs"
                        className="gap-2 rounded-full before:rounded-full"
                        onClick={() => onRemove(skill.slug)}
                      >
                        {skill.name}
                        <XIcon className="size-3.5 opacity-60" />
                      </Button>
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
