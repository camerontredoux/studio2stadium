import { useSession } from "@/lib/session";
import { FeedItem } from "./feed-item";
import { ProgramSpotlight } from "./program-spotlight";

export function Feed() {
  const session = useSession();

  return (
    <div className="gap-2 xl:gap-4 flex flex-col">
      <div className="mb-1 hidden lg:block">
        <h1 className="text-xl sm:text-2xl font-bold">
          Welcome back, {session.username}!
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Here's your latest personalized content
        </p>
      </div>

      <ProgramSpotlight />
      <div className="rounded-t-xl rounded-b-xl border sm:border-none overflow-clip space-y-2 xl:space-y-4">
        {Array.from({ length: 10 }).map((_, idx) => (
          <FeedItem key={idx} />
        ))}
      </div>
    </div>
  );
}
