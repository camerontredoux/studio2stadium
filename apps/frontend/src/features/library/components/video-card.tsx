import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Frame, FramePanel } from "@/components/ui/frame";
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
      className="group [contain-intrinsic-block-size:auto_300px] [content-visibility:auto]"
    >
      <FramePanel side="inset">
        <Dialog>
          <DialogTrigger
            render={
              <div className="relative flex aspect-video cursor-pointer items-center justify-center">
                <img
                  src={`https://img.youtube.com/vi/${image}/hqdefault.jpg`}
                  alt={imageAlt}
                  className="aspect-video w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-black/80 to-transparent" />
                {badge && (
                  <Badge variant="brand" className="absolute top-2.5 left-2.5">
                    {badge}
                  </Badge>
                )}
              </div>
            }
          />
          <DialogContent className="max-w-7xl overflow-clip">
            <DialogHeader>
              <DialogTitle>Watch Video</DialogTitle>
            </DialogHeader>
            <div className="aspect-video max-h-[calc(100dvh-8rem)]">
              <iframe src={url} className="h-full w-full" />
            </div>
          </DialogContent>
        </Dialog>

        <div className="from-brand/10 via-background to-background group-hover:from-brand/8 group-hover:via-brand/4 relative flex flex-1 flex-col gap-2.5 bg-linear-to-br p-3 transition-colors duration-75 sm:p-4">
          <div
            className="bg-brand pointer-events-none absolute inset-0 opacity-[0.12] dark:opacity-[0.06]"
            aria-hidden
          />
          <div className="flex flex-1 flex-col gap-1.5">
            <h3
              title={title}
              aria-label={title}
              className="group-hover:text-brand truncate text-sm leading-snug font-semibold transition-colors"
            >
              {title}
            </h3>
          </div>
        </div>
      </FramePanel>
    </Frame>
  );
}
