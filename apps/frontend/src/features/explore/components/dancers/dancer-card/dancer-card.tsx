import type { ApiSchemas } from "@/lib/api/client";
import { CardAvatar } from "./card-avatar";
import { CardBackground } from "./card-background";
import { CardButtons } from "./card-buttons";
import { CardContent } from "./card-content";
import { CardLoader } from "./card-loader";

export type School = ApiSchemas["SchoolsResponse"]["schools"][number];

interface DancerCardProps {
  school: School;
  isLoaderRow: boolean;
}

export function DancerCard({ school, isLoaderRow }: DancerCardProps) {
  if (isLoaderRow) {
    return <CardLoader />;
  }

  return (
    <div className="sm:h-26 relative rounded-xl border bg-clip-padding overflow-clip p-3 sm:p-4 flex gap-3 bg-linear-to-br from-brand/10 via-background to-background hover:from-brand/16 hover:via-brand/8 transition-colors contain-[layout_style_paint] sm:items-center flex-row">
      <CardBackground />

      <div className="flex h-full gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-row">
        <CardAvatar school={school} />
        <CardContent school={school} />
      </div>
      <CardButtons username={school.user?.username ?? ""} />
    </div>
  );
}
