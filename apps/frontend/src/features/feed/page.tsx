import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { OrgStoriesRail } from "@/components/shared/org-stories-rail";
import { FeedSidebar } from "@/features/feed/components/sidebar/sidebar";

import { useSession } from "@/lib/session";
import { Suspense } from "react";
import { Feed } from "./components/feed";
import { FeedSkeleton } from "./components/feed-skeleton";
import { FreeTierAlert } from "./components/free-tier-alert";
import { PremiumRoadmap } from "./components/roadmap/premium-roadmap";
import { DancerSpotlight } from "./components/spotlight/dancer-spotlight";
import { DancerSpotlightSkeleton } from "./components/spotlight/dancer-spotlight-skeleton";
import { PrioritySpotlight } from "./components/spotlight/priority-spotlight";
import { PrioritySpotlightSkeleton } from "./components/spotlight/priority-spotlight-skeleton";
import { ProgramSpotlight } from "./components/spotlight/program-spotlight";
import { ProgramSpotlightSkeleton } from "./components/spotlight/program-spotlight-skeleton";
import { SpotlightAd } from "./components/spotlight/spotlight-ad";

export function FeedPage() {
  const session = useSession();

  return (
    <SidebarLayout
      sidebar={<FeedSidebar type={session.type} />}
      tabs={{ contentLabel: "Feed", sidebarLabel: "Discover" }}
    >
      <div className="flex flex-col gap-2 lg:gap-4">
        <OrgStoriesRail />

        <div className="hidden lg:block">
          <h1 className="text-2xl leading-none font-bold tracking-tight">
            Welcome back, {session.firstName}!
          </h1>
          <p className="text-muted-foreground text-sm">
            Here's your latest personalized content
          </p>
        </div>

        {session.type === "dancer" && (
          <>
            <FreeTierAlert />
            <PremiumRoadmap />
            <SpotlightAd />
            <Suspense fallback={<ProgramSpotlightSkeleton />}>
              <ProgramSpotlight />
            </Suspense>
          </>
        )}

        {session.type === "school" && (
          <>
            <Suspense fallback={<PrioritySpotlightSkeleton />}>
              <PrioritySpotlight />
            </Suspense>
            <Suspense fallback={<DancerSpotlightSkeleton />}>
              <DancerSpotlight />
            </Suspense>
          </>
        )}

        <Suspense fallback={<FeedSkeleton />}>
          <Feed />
        </Suspense>
      </div>
    </SidebarLayout>
  );
}
