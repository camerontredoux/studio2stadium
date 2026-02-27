import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { FeedSidebar } from "@/features/feed/components/sidebar/sidebar";

import { useSession } from "@/lib/session";
import { Suspense } from "react";
import { Feed } from "./components/feed";
import { FeedSkeleton } from "./components/feed-skeleton";
import { ProgramSpotlight } from "./components/spotlight/program-spotlight";

export function FeedPage() {
  const session = useSession();

  return (
    <SidebarLayout
      sidebar={<FeedSidebar type={session.type} />}
      tabs={{ contentLabel: "Feed", sidebarLabel: "Discover" }}
    >
      <div className="flex flex-col gap-2 lg:gap-4">
        <div className="hidden lg:block">
          <h1 className="text-2xl leading-none font-bold tracking-tight">
            Welcome back, {session.firstName}!
          </h1>
          <p className="text-muted-foreground text-sm">
            Here's your latest personalized content
          </p>
        </div>

        {session.type === "dancer" && <ProgramSpotlight />}

        <Suspense fallback={<FeedSkeleton />}>
          <Feed />
        </Suspense>
      </div>
    </SidebarLayout>
  );
}
