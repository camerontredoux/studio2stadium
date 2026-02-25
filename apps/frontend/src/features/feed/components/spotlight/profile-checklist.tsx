import { Button } from "@/components/ui/button";
import { SkillsList } from "@/features/dancer/components/profile/skills-list";
import { SportsList } from "@/features/dancer/components/profile/sports-list";
import { StylesList } from "@/features/dancer/components/profile/styles-list";
import { useSession } from "@/lib/session";
import { feedQueries } from "@/shared/feed/api/queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { SparklesIcon } from "lucide-react";
import { ChecklistItem } from "./checklist-item";

export function ProfileChecklist() {
  const session = useSession();
  const { data } = useSuspenseQuery(feedQueries.dancerChecklist());

  return (
    <div className="overflow-clip rounded-2xl border">
      <div className="from-brand/10 via-brand/5 to-background relative overflow-clip bg-linear-to-br p-4">
        <div className="text-brand absolute -top-1 -left-2 -z-10 flex items-center gap-2 opacity-10">
          <SparklesIcon className="size-24 rotate-6" />
          <SparklesIcon className="size-16 rotate-186" />
        </div>
        <div className="flex justify-between gap-2">
          <h2 className="font-semibold">Complete your profile</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Add the following to see your recommended programs
        </p>
      </div>
      <div className="from-brand/10 via-background to-background border-t bg-linear-to-tl p-4">
        <h3 className="text-muted-foreground mb-2 text-sm">
          Click each item to complete your profile
        </h3>
        <div className="w-full space-y-2">
          <SkillsList disabled={data.skills} className="w-full justify-start">
            <ChecklistItem
              checked={data.skills}
              label="Select minimum of 10 skills"
            />
          </SkillsList>
          <StylesList
            render={
              <Button
                disabled={data.styles}
                variant="outline"
                className="w-full justify-start"
              >
                <ChecklistItem
                  checked={data.styles}
                  label="Select maximum of 3 styles"
                />
              </Button>
            }
          />
          <SportsList
            render={
              <Button
                disabled={data.sports}
                variant="outline"
                className="w-full justify-start"
              >
                <ChecklistItem
                  checked={data.sports}
                  label="Select your sports"
                />
              </Button>
            }
          />
          <Button
            disabled={data.location}
            variant="outline"
            className="w-full justify-start"
          >
            <ChecklistItem
              checked={data.location}
              label="Choose current or desired location"
            />
          </Button>
          {data.gpa ? (
            <Button
              disabled
              variant="outline"
              className="w-full justify-start"
            >
              <ChecklistItem checked label="Enter your current GPA" />
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start"
              render={
                <Link
                  to="/$username"
                  params={{ username: session.username }}
                />
              }
            >
              <ChecklistItem checked={false} label="Enter your current GPA" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
