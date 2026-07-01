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
import { CalendarIcon, CrownIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { useViewDancer } from "./api/mutations";
import { dancerQueries } from "./api/queries";
import { Achievements } from "./components/profile/achievements";
import { Biography } from "./components/profile/biography";
import { ProfileProvider } from "./components/profile/context/profile-provider";
import { Events } from "./components/profile/events";
import { DancerHero } from "./components/profile/hero";
import { References } from "./components/profile/references";
import { ContactInfo } from "./components/profile/sidebar/contact-info";
import { ExtraInfo } from "./components/profile/sidebar/extra-info";
import { Skills } from "./components/profile/skills";
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
  const { mutate: viewDancer } = useViewDancer();

  const hasNotified = useRef(false);

  useEffect(() => {
    if (!hasNotified.current && session.type === "school") {
      hasNotified.current = true;
      viewDancer({ params: { path: { id: data.id } } });
    }
  }, [data.id, viewDancer, session.type]);

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

  // Profile visibility tiers — driven by orgAccountTier + Stripe status.
  // Stripe always wins: a paying org user sees the full premium experience.
  const tier = data.subscribed
    ? "premium"
    : data.orgAccountTier ?? "free";
  const showSidebar = tier !== "limited";
  const showContent = tier !== "limited";
  const showSubmission = tier === "premium";
  const showSkills = tier === "free" || tier === "premium";
  const showEvents = tier === "premium";
  const showMedia = tier !== "limited";

  return (
    <ProfileProvider isOwner={isOwner} isPreview={isPreview}>
      <SidebarLayout
        sidebar={
          <>
            {isOwner && !isPreview ? <ProfileOrganizations /> : null}
            {showSidebar ? <ContactInfo dancer={data} /> : null}
            {showSidebar ? <ExtraInfo dancer={data} /> : null}
          </>
        }
        tabs={{ contentLabel: "Profile", sidebarLabel: "Extra" }}
      >
        <div className="flex flex-col gap-3 lg:gap-4">
          <div className="flex flex-col gap-3 lg:gap-4">
            <DancerHero dancer={data} />

            {isOwner && !isPreview && data.orgAccountTier && !data.subscribed ? (
              <div className="border-brand/20 bg-brand/5 flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-brand/10 rounded-full p-2">
                    <CrownIcon className="text-brand size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Unlock with Studio 2 Stadium
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Get a Studio 2 Stadium membership to upload videos,
                      showcase skills, and get discovered by coaches.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  render={<Link to="/checkout" />}
                >
                  Get Started
                </Button>
              </div>
            ) : null}

            {showContent ? (
              <Biography description={data.biography} username={username} />
            ) : null}

            {showContent ? (
              <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                <Achievements
                  achievements={data.achievements}
                  username={username}
                />
                <References references={data.references} username={username} />
              </div>
            ) : null}

            {showSubmission ? <Submission data={data.submission} /> : null}

            {showMedia ? (
              <MediaGallery
                images={data.images}
                videos={data.videos}
                showOwnerControls={isOwner && !isPreview}
                orgAccountTier={data.orgAccountTier}
              />
            ) : null}

            {showSkills ? (
              <Skills skills={data.skills} username={username} />
            ) : null}

            {showEvents ? (
              <Events events={data.events} globalEvents={data.globalEvents} />
            ) : null}
          </div>
        </div>
      </SidebarLayout>
    </ProfileProvider>
  );
}
