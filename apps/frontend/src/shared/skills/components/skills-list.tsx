import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import { skillQueries } from "../api/queries";
import type { Skill } from "../types";
import { SkillsByCategory } from "./skills-by-category";
import { SkillsSummary } from "./skills-summary";

interface SkillsListProps {
  selectedSkillIds: string[];
  onToggle: (skillId: string) => void;
  summarySlot?: ReactNode;
}

export function SkillsList({
  selectedSkillIds,
  onToggle,
  summarySlot,
}: SkillsListProps) {
  const { data } = useSuspenseQuery(skillQueries.all());

  const skillsByCategory = data.reduce(
    (acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = [];
      }
      acc[skill.category].push(skill);
      return acc;
    },
    {} as Record<string, Skill[]>,
  );

  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    Object.keys(skillsByCategory)[0],
  );

  return (
    <div className="flex h-full flex-col gap-4 md:flex-row md:gap-6">
      <div className="flex flex-1 flex-col gap-4 pb-2">
        <Select
          value={selectedCategory}
          onValueChange={(value) => setSelectedCategory(value ?? undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(skillsByCategory).map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCategory && (
          <SkillsByCategory
            skills={skillsByCategory[selectedCategory]}
            selectedSkillIds={selectedSkillIds}
            onToggle={onToggle}
          />
        )}
      </div>
      {summarySlot ?? (
        <SkillsSummary
          className="hidden md:flex"
          selectedSkillIds={selectedSkillIds}
          onRemove={onToggle}
        />
      )}
    </div>
  );
}
