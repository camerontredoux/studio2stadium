import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { FeedSidebar } from "@/features/feed/components/sidebar/sidebar";

import { useSession } from "@/lib/session";
import { Feed } from "./components/feed";
import { ProgramSpotlight } from "./components/program-spotlight";

export function FeedPage() {
  const session = useSession();
  return (
    <SidebarLayout
      sidebar={<FeedSidebar />}
      tabs={{ contentLabel: "Feed", sidebarLabel: "Discover" }}
    >
      <div className="mobile:pb-14 flex flex-col gap-2 lg:gap-4">
        <div className="hidden lg:block">
          <h1 className="text-2xl leading-none font-bold tracking-tight">
            Welcome back, {session.username}!
          </h1>
          <p className="text-muted-foreground text-sm">
            Here's your latest personalized content
          </p>
        </div>

        <ProgramSpotlight />

        <Feed />
      </div>
    </SidebarLayout>
  );
}
