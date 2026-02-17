import type { FeedItem } from "../types";
import { FeedImage } from "./feed-image";
import { FeedVideo } from "./feed-video";

export function FeedContent({ item }: { item: FeedItem }) {
  switch (item.contentType) {
    case "image":
      return <FeedImage item={item} />;
    case "video":
      return <FeedVideo item={item} />;
    case "profile":
    case "achievement":
    case "reference":
      return null;
  }
}
