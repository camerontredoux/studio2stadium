import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { FeedSidebar } from "@/features/feed/components/sidebar/sidebar";

import { useSession } from "@/lib/session";
import { FeedItem } from "./components/feed-item";
import { ProgramSpotlight } from "./components/program-spotlight";

export function FeedPage() {
  const session = useSession();
  return (
    <SidebarLayout sidebar={<FeedSidebar />}>
      <div className="flex flex-col gap-2 max-lg:pb-14 lg:gap-4">
        <div className="hidden lg:block">
          <h1 className="text-2xl leading-none font-bold tracking-tight">
            Welcome back, {session.username}!
          </h1>
          <p className="text-muted-foreground text-sm">
            Here's your latest personalized content
          </p>
        </div>

        <ProgramSpotlight />

        <div className="space-y-2 overflow-clip rounded-t-xl rounded-b-xl border sm:border-none lg:space-y-4">
          {Array.from({ length: 10 }).map((_, idx) => (
            <FeedItem key={idx} />
          ))}
        </div>
      </div>
    </SidebarLayout>
  );
}
