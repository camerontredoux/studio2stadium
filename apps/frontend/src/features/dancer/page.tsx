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
import { useSession } from "@/lib/session";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useSearch } from "@tanstack/react-router";
import { CalendarIcon } from "lucide-react";
import { dancerQueries } from "./api/queries";
import { Achievements } from "./components/profile/achievements";
import { Biography } from "./components/profile/biography";
import { ProfileProvider } from "./components/profile/context/profile-provider";
import { Events } from "./components/profile/events";
import { DancerHero } from "./components/profile/hero";
import { References } from "./components/profile/references";
import { ContactInfo } from "./components/profile/sidebar/contact-info";
import { ExtraInfo } from "./components/profile/sidebar/extra-info";
import { Submission } from "./components/profile/submission";

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

  const isOwner = visible;
  const isPreview = mode === "preview";

  return (
    <ProfileProvider isOwner={isOwner} isPreview={isPreview}>
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
            <DancerHero dancer={data} />

            <Biography description={data.biography} username={username} />
            <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
              <Achievements
                achievements={data.achievements}
                username={username}
              />
              <References references={data.references} username={username} />
            </div>
            {data.subscribed ? (
              <>
                <Submission />
                <Events events={data.events} />
              </>
            ) : null}
          </div>
        </div>
      </SidebarLayout>
    </ProfileProvider>
  );
}
