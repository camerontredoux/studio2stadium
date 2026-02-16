import type { FeedItem } from "../types";
import { FeedImage } from "./feed-image";
import { FeedVideo } from "./feed-video";

export function FeedContent({ item }: { item: FeedItem }) {
  switch (item.contentType) {
    case "image":
      return <FeedImage image={item.content?.mediaUrl ?? ""} />;
    case "video":
      return <FeedVideo video={item.content?.mediaId ?? ""} />;
    case "profile":
    case "achievement":
    case "reference":
      return null;
  }
}
