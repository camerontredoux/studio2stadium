import { Badge } from "@/components/ui/badge";
import { HeartIcon } from "lucide-react";

export function CardInfo({ isFollowing }: { isFollowing?: boolean }) {
  return (
    isFollowing && (
      <Badge variant="brand" className="gap-1">
        <HeartIcon className="size-3 fill-current" />
        Following
      </Badge>
    )
  );
}
