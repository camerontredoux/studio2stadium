import { useSession } from "@/lib/session";
import { FeedItem } from "./feed-item";
import { ProgramSpotlight } from "./program-spotlight";

export function Feed() {
  const session = useSession();

  return (
    <div className="flex flex-col gap-2 max-lg:pb-14 lg:gap-4">
      <div className="mb-1 hidden lg:block">
        <h1 className="text-xl leading-none font-bold tracking-tight sm:text-2xl">
          Welcome back, {session.username}!
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm">
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
  );
}
