import { Badge } from "@/components/ui/badge";
import { HeartIcon } from "lucide-react";

export function CardInfo({ isFollowing }: { isFollowing?: boolean }) {
  return (
    <div className="h-full shrink-0">
      {isFollowing && (
        <Badge variant="brand" className="gap-1">
          <HeartIcon className="size-3 fill-current" />
          Following
        </Badge>
      )}
    </div>
  );
}
