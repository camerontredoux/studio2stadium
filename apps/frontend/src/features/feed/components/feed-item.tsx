import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { dateToRelativeTime } from "@/utils/date";
import { Link } from "@tanstack/react-router";
import { HeartIcon, MessageCircleIcon, VerifiedIcon } from "lucide-react";
import { FeedContent } from "./content/feed-content";
import type { FeedItem } from "./types";

interface FeedItemProps {
  item: FeedItem;
}

export function FeedItem({ item }: FeedItemProps) {
  return (
    <div className="overflow-clip sm:rounded-2xl sm:border">
      <FeedContent item={item} />
      <div className="flex flex-col py-2 sm:gap-2 sm:p-4">
        <div className="flex items-start gap-2">
          <Avatar className="size-10 rounded-lg sm:size-12 sm:rounded-xl">
            <AvatarImage src={item.user?.avatar ?? ""} />
            <AvatarFallback>
              {item.user?.username?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <Link
              className="flex w-fit items-center gap-1 text-sm leading-0 font-semibold hover:opacity-90 sm:text-base"
              to={`/explore/$username`}
              params={{ username: item.user.username }}
            >
              {item.user?.schoolProfile?.name}{" "}
              <VerifiedIcon className="text-brand size-4" />
            </Link>
            <p className="text-muted-foreground flex items-center gap-1 text-xs sm:text-sm">
              posted {item.contentType} <span>•</span>{" "}
              {dateToRelativeTime(item.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm sm:text-base">
            {item.content?.caption}
          </div>
          <div className="flex items-center gap-2 border-t pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <HeartIcon className="size-4" />{" "}
              <span className="text-xs sm:text-sm">847</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <MessageCircleIcon className="size-3.5" />{" "}
              <span className="text-xs sm:text-sm">123</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
