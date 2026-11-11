import type { Image, MediaItem, Video } from "./types";

/**
 * Gallery order. Media the owner has never reordered has no position and
 * shows first, newest first, as the whole gallery did before ordering
 * existed; so a new upload still lands at the front. The owner's saved order
 * follows.
 */
export function sortMedia(images: Image[], videos: Video[]): MediaItem[] {
  const items: MediaItem[] = [
    ...images.map((data) => ({ type: "image" as const, data })),
    ...videos.map((data) => ({ type: "video" as const, data })),
  ];

  return items.sort((a, b) => {
    const pa = a.data.position ?? null;
    const pb = b.data.position ?? null;
    if (pa === null && pb === null) {
      return (
        new Date(b.data.createdAt).getTime() -
        new Date(a.data.createdAt).getTime()
      );
    }
    if (pa === null) return -1;
    if (pb === null) return 1;
    return pa - pb;
  });
}

export const mediaKey = (item: MediaItem) => `${item.type}:${item.data.id}`;
