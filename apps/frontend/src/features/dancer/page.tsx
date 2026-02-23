import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/lib/session";
import { queries } from "@/shared/api/queries";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useSearch } from "@tanstack/react-router";
import { CalendarIcon } from "lucide-react";
import { Suspense } from "react";
import { dancerQueries } from "./api/queries";
import { DancerFollowingDialog } from "./components/following-dialog";
import { DancerAbout } from "./components/profile/dancer-about";
import { FavoriteSection } from "./components/profile/favorite-section";
import { DancerHero } from "./components/profile/hero";
import { ContactInfo } from "./components/profile/sidebar/contact-info";
import { ExtraInfo } from "./components/profile/sidebar/extra-info";
import { SkillsList } from "./components/profile/skills-list";

interface DancerPageProps {
  username: string;
}

export function DancerPage({ username }: DancerPageProps) {
  const session = useSession();
  const mode = useSearch({
    from: "/_app/(routes)/$username",
    select: (search) => search.mode,
  });

  const { data } = useSuspenseQuery(dancerQueries.profile(username));
  const { data: activity } = useQuery(queries.activity());

  const visible = session.username === username;

  if (!data) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Dancer not found</EmptyTitle>
          <EmptyDescription>
            The dancer you're looking for doesn't exist.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <EmptyMedia variant="icon">
            <CalendarIcon className="size-10" />
          </EmptyMedia>
          <Button render={<Link to="/explore" />}>Back to Explore</Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <SidebarLayout
      sidebar={
        <>
          <ContactInfo dancer={data} />
          <ExtraInfo dancer={data} />
        </>
      }
      tabs={{ contentLabel: "Profile", sidebarLabel: "Extra" }}
    >
      <div className="mobile:pb-14 flex flex-col gap-3 lg:gap-4">
        <div className="flex flex-col gap-3 lg:gap-4">
          <DancerHero visible={visible} mode={mode} dancer={data} />

          <DancerAbout description={data.biography} />

          <Separator className="my-2" />

          <div>
            {session.type === "school" && <FavoriteSection dancer={data} />}
            <DancerFollowingDialog>
              <Button>{activity?.following} Following</Button>
            </DancerFollowingDialog>
            <Suspense fallback={<div>Loading...</div>}>
              <SkillsList />
            </Suspense>
            <pre className="max-w-full wrap-break-word whitespace-pre-wrap">
              {JSON.stringify({ session, data }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
