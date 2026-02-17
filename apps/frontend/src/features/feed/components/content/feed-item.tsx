import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { dateToRelativeTime } from "@/utils/date";
import { Link } from "@tanstack/react-router";
import { VerifiedIcon } from "lucide-react";
import type { FeedItem } from "../types";
import { FeedContent } from "./feed-content";
import { FeedDescription } from "./feed-description";

interface FeedItemProps {
  item: FeedItem;
}

export function FeedItem({ item }: FeedItemProps) {
  return (
    <div className="overflow-clip sm:rounded-2xl sm:border">
      <FeedContent item={item} />
      <div className="flex flex-col gap-2 py-2 sm:gap-4 sm:p-4">
        <div className="flex items-start gap-2">
          <Avatar className="size-8 rounded-full sm:size-9">
            <AvatarImage src={item.avatar ?? ""} />
            <AvatarFallback>
              {item.username?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <Link
              className="flex items-center gap-1 text-sm leading-none font-semibold hover:opacity-90 sm:text-base"
              to={`/explore/$username`}
              params={{ username: item.username }}
            >
              <span className="truncate">{item.name}</span>
              <VerifiedIcon className="text-brand size-4 shrink-0" />
            </Link>
            <p className="text-muted-foreground flex items-center gap-1 text-xs sm:text-sm">
              posted {item.contentType} <span>•</span>{" "}
              <span title={new Date(item.createdAt).toISOString()}>
                {dateToRelativeTime(item.createdAt)}
              </span>
            </p>
          </div>
        </div>

        <FeedDescription caption={item.caption} />
      </div>
    </div>
  );
}
