import { useSession } from "@/lib/session";
import { ProgramSpotlight } from "./program-spotlight";

export function Feed() {
  const session = useSession();

  return (
    <div className="gap-2 flex flex-col">
      <div className="mb-1 mobile:hidden">
        <h1 className="text-xl sm:text-2xl font-bold">
          Welcome back, {session.username}!
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Here's your latest personalized content
        </p>
      </div>

      <ProgramSpotlight />

      <div className="rounded-xl border p-4 aspect-video max-h-96"></div>
      <div className="rounded-xl border p-4 aspect-video max-h-96"></div>
      <div className="rounded-xl border p-4 aspect-video max-h-96"></div>
      <div className="rounded-xl border p-4 aspect-video max-h-96"></div>
      <div className="rounded-xl border p-4 aspect-video max-h-96"></div>
      <div className="rounded-xl border p-4 aspect-video max-h-96"></div>
    </div>
  );
}
