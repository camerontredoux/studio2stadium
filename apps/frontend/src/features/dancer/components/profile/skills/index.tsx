import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { SkillsList } from "@/features/dancer/components/profile/skills-list";
import { type ApiSchemas } from "@/lib/api/client";
import { PlusIcon } from "lucide-react";
import { useProfile } from "../context/use-profile";

type ProfileSkill = ApiSchemas["DancersIdResponse"]["skills"][number];

function groupByCategory(skills: ProfileSkill[]) {
  const hasCategory = skills.some((s) => s.category?.trim());
  if (!hasCategory) {
    return [{ category: null, skills }] as const;
  }
  const map = new Map<string, ProfileSkill[]>();
  for (const skill of skills) {
    const key = skill.category?.trim() ?? "";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(skill);
  }
  return Array.from(map.entries()).map(([category, list]) => ({
    category: category || null,
    skills: list,
  }));
}

export function Skills({
  skills,
  username,
}: {
  skills: ProfileSkill[];
  username: string;
}) {
  const { showOwnerControls } = useProfile();
  const groups = groupByCategory(skills);

  return (
    <Frame className="h-fit w-full">
      <FrameHeader>
        <FrameTitle className="flex items-center justify-between gap-2">
          Skills
          {showOwnerControls ? (
            <SkillsList
              username={username}
              render={<Button size="icon-xs" variant="ghost" />}
            >
              <PlusIcon />
            </SkillsList>
          ) : (
            <div className="h-7 w-fit sm:h-6" />
          )}
        </FrameTitle>
      </FrameHeader>
      <FramePanel className="p-0!">
        {skills.length > 0 ? (
          <Accordion
            defaultValue={groups.length > 0 ? [groups[0].category ?? "_"] : []}
            className="w-full"
          >
            {groups.map(({ category, skills: groupSkills }) => {
              const value = category ?? "_";
              return (
                <AccordionItem key={value} value={value}>
                  <AccordionTrigger className="text-muted-foreground rounded-none px-4 text-sm font-medium hover:no-underline">
                    {category ?? "Skills"}
                  </AccordionTrigger>
                  <AccordionPanel className="px-4 pb-4">
                    <div className="flex flex-wrap gap-2">
                      {groupSkills.map((skill) => (
                        <Badge
                          key={skill.slug}
                          variant="brand"
                          className="rounded-full"
                        >
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  </AccordionPanel>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          <div className="text-muted-foreground p-4 text-sm">
            No skills selected
          </div>
        )}
      </FramePanel>
    </Frame>
  );
}
