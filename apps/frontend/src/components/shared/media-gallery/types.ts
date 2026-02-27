export interface Image {
  id: string;
  createdAt: string;
  mediaUrl: string | null;
  caption: string | null;
}

export interface Video {
  id: string;
  createdAt: string;
  mediaId: string;
  caption: string | null;
}

export type MediaItem =
  | { type: "image"; data: Image }
  | { type: "video"; data: Video };
