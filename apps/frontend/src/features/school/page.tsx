import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { MediaGallery } from "@/components/shared/media-gallery";
import { ProfileOrganizations } from "@/components/shared/profile-organizations";
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
import { School2Icon } from "lucide-react";
import { schoolQueries } from "./api/queries";
import { ProfileProvider } from "./components/profile/context/profile-provider";
import { SchoolHero } from "./components/profile/hero";
import { EventsAttending } from "./components/profile/sections/events-attending";
import { EventsSection } from "./components/profile/sections/events/events-section";
import { ProgramDetails } from "./components/profile/sections/program-details";
import { SkillsSection } from "./components/profile/sections/skills-section";
import { ContactInfo } from "./components/profile/sidebar/contact-info";
import { TeamInfo } from "./components/profile/sidebar/team-info";

interface SchoolPageProps {
  username: string;
}

export function SchoolPage({ username }: SchoolPageProps) {
  const session = useSession();
  const mode = useSearch({
    from: "/_app/(routes)/explore/$username",
    select: (search) => search.mode,
  });

  const { data } = useSuspenseQuery(schoolQueries.profile(username));

  const isOwner = session.username === username;

  if (!data) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>School not found</EmptyTitle>
          <EmptyDescription>
            The school you're looking for doesn't exist.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <EmptyMedia variant="icon">
            <School2Icon className="size-10" />
          </EmptyMedia>
          <Button render={<Link to="/explore" />}>Back to Explore</Button>
        </EmptyContent>
      </Empty>
    );
  }

  const isPreview = mode === "preview";

  return (
    <ProfileProvider
      username={username}
      isOwner={isOwner}
      isPreview={isPreview}
    >
      <SidebarLayout
        sidebar={
          <>
            <ContactInfo school={data} />
            <TeamInfo school={data} />
            {isOwner ? <ProfileOrganizations /> : null}
          </>
        }
        tabs={{ contentLabel: "Profile", sidebarLabel: "Info" }}
      >
        <div className="flex flex-col gap-3 lg:gap-4">
          <SchoolHero school={data} />

          <ProgramDetails school={data} />

          <MediaGallery
            images={data.images}
            videos={data.videos}
            showOwnerControls={isOwner && !isPreview}
          />

          <SkillsSection skills={data.skills} />

          <EventsSection events={data.events} />

          <EventsAttending globalEvents={data.globalEvents ?? []} />
        </div>
      </SidebarLayout>
    </ProfileProvider>
  );
}
