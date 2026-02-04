import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { FeedSidebar } from "@/features/feed/components/sidebar/sidebar";

import { useSession } from "@/lib/session";
import { FeedItem } from "./components/feed-item";
import { ProgramSpotlight } from "./components/program-spotlight";

export function FeedPage() {
  const session = useSession();
  return (
    <SidebarLayout sidebar={<FeedSidebar />}>
      <div className="gap-2 lg:gap-4 flex flex-col max-lg:pb-14">
        <div className="hidden lg:block">
          <h1 className="text-2xl font-bold tracking-tight leading-none">
            Welcome back, {session.username}!
          </h1>
          <p className="text-sm text-muted-foreground">
            Here's your latest personalized content
          </p>
        </div>

        <ProgramSpotlight />

        <div className="rounded-t-xl rounded-b-xl border sm:border-none overflow-clip space-y-2 lg:space-y-4">
          {Array.from({ length: 10 }).map((_, idx) => (
            <FeedItem key={idx} />
          ))}
        </div>
      </div>
    </SidebarLayout>
  );
}
