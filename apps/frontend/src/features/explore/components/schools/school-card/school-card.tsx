import { Link } from "@tanstack/react-router";
import type { School } from "../../types/school";
import { CardAvatar } from "./card-avatar";
import { CardBackground } from "./card-background";
import { CardContent } from "./card-content";

interface SchoolCardProps {
  school: School;
  isFollowing?: boolean;
}

export function SchoolCard({ school, isFollowing }: SchoolCardProps) {
  return (
    <Link
      to={"/explore/$username"}
      params={{ username: school.user!.username }}
    >
      <div className="from-brand/10 via-background to-background hover:from-brand/16 hover:via-brand/8 relative flex flex-row gap-3 overflow-clip rounded-xl border bg-linear-to-br bg-clip-padding p-3 transition-colors duration-75 contain-[layout_style_paint] sm:items-center sm:p-4">
        <CardBackground />

        <div className="flex h-full min-w-0 flex-1 items-start gap-2 sm:flex-row sm:gap-3">
          <CardAvatar user={school.user} />
          <CardContent school={school} isFollowing={isFollowing} />
        </div>
      </div>
    </Link>
  );
}
