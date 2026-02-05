import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import type { ApiSchemas } from "@/lib/api/client";
import { getYouTubeId } from "@/utils/get-youtube-id";

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
      url={video.url}
    />
  );
}

interface ContentCardProps {
  image: string | null;
  imageAlt: string;
  badge?: string;
  title: string;
  url: string;
}

export function ContentCard({
  image,
  imageAlt,
  badge,
  title,
  url,
}: ContentCardProps) {
  return (
    <Frame
      compact
      className="group [content-visibility:auto] [contain-intrinsic-block-size:auto_300px]"
    >
      <FramePanel side="top">
        <Dialog>
          <DialogTrigger
            render={
              <div className="group cursor-pointer relative flex items-center justify-center aspect-video">
                <img
                  src={`https://img.youtube.com/vi/${image}/hqdefault.jpg`}
                  alt={imageAlt}
                  className="w-full aspect-video object-cover"
                />
                <div className="group-hover:from-black/60 absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-black/80 to-transparent pointer-events-none" />
                {badge && (
                  <Badge variant="brand" className="absolute top-2.5 left-2.5">
                    {badge}
                  </Badge>
                )}
              </div>
            }
          />
          <DialogContent className="overflow-clip max-w-7xl">
            <DialogHeader>
              <DialogTitle>Watch Video</DialogTitle>
            </DialogHeader>
            <div className="aspect-video max-h-[calc(100dvh-8rem)]">
              <iframe src={url} className="h-full w-full" />
            </div>
          </DialogContent>
        </Dialog>
      </FramePanel>
      <FrameFooter>{title}</FrameFooter>
    </Frame>
  );
}
