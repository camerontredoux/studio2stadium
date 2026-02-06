import type { ApiSchemas } from "@/lib/api/client";
import { CardAvatar } from "./card-avatar";
import { CardBackground } from "./card-background";
import { CardButtons } from "./card-buttons";
import { CardContent } from "./card-content";

export type School = ApiSchemas["SchoolsResponse"][number];

interface SchoolCardProps {
  school: School;
}

export function SchoolCard({ school }: SchoolCardProps) {
  return (
    <div className="from-brand/10 via-background to-background hover:from-brand/16 hover:via-brand/8 relative flex flex-row gap-3 overflow-clip rounded-xl border bg-linear-to-br bg-clip-padding p-3 transition-colors duration-75 contain-[layout_style_paint] sm:h-26 sm:items-center sm:p-4">
      <CardBackground />

      <div className="flex h-full min-w-0 flex-1 gap-2 sm:flex-row sm:gap-3">
        <CardAvatar user={school.user} />
        <CardContent school={school} />
      </div>
      <CardButtons username={school.user?.username} />
    </div>
  );
}
