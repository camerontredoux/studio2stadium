import { Button } from "@/components/ui/button";
import type { ApiSchemas } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import type { ReactNode } from "react";
import { getYouTubeId } from "@/utils/get-youtube-id";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Video = ApiSchemas["LibraryResponse"][number]["videos"][number];

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  const id = getYouTubeId(video.url);
  return (
    <ContentCard
      image={id}
      imageAlt={video.title}
      badge={video.category}
      title={video.title}
      footer={
        <Dialog>
          <DialogTrigger render={<Button size="xs" className="gap-1.5" />}>
            Play Video
          </DialogTrigger>
          <DialogContent className="overflow-clip max-w-7xl">
            <DialogHeader>
              <DialogTitle>Watch Video</DialogTitle>
            </DialogHeader>
            <div className="w-full aspect-video h-full">
              <iframe src={video.url} className="h-full w-full" />
            </div>
          </DialogContent>
        </Dialog>
      }
    />
  );
}

interface ContentCardProps {
  image: string | null;
  imageAlt: string;
  badge?: string;
  title: string;
  footer: ReactNode;
}

export function ContentCard({
  image,
  imageAlt,
  badge,
  title,
  footer,
}: ContentCardProps) {
  return (
    <Frame
      compact
      className="group [content-visibility:auto] [contain-intrinsic-block-size:auto_300px]"
    >
      <FramePanel side="top">
        <div className="relative border-b flex items-center justify-center aspect-video">
          <img
            src={`https://img.youtube.com/vi/${image}/hqdefault.jpg`}
            alt={imageAlt}
            className="w-full aspect-video object-cover"
          />
          <div className="absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-black/80 to-transparent pointer-events-none" />
          {badge && (
            <Badge variant="brand" className="absolute top-2.5 left-2.5">
              {badge}
            </Badge>
          )}
        </div>

        <div className="relative duration-75 p-3 sm:p-4 flex flex-col gap-2.5 flex-1 bg-linear-to-br from-brand/10 via-background to-background group-hover:from-brand/8 group-hover:via-brand/4 transition-colors">
          <div className="flex flex-col gap-1.5 flex-1">
            <h3 className="font-semibold text-base leading-snug truncate group-hover:text-brand transition-colors">
              {title}
            </h3>
          </div>
        </div>
      </FramePanel>

      <FrameFooter className="gap-2 px-3 sm:px-4 py-2.5">{footer}</FrameFooter>
    </Frame>
  );
}
