import { ContentCard } from "@/components/shared/content-card";
import { Button } from "@/components/ui/button";
import { PlayIcon } from "lucide-react";

export interface Video {
  id: string;
  title: string;
  description: string;
  tag: string;
  image: string;
  date: string;
}

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <ContentCard
      image={video.image}
      imageAlt={video.title}
      badge={video.tag}
      title={video.title}
      footer={
        <Button size="xs" className="gap-1.5">
          <PlayIcon /> Play Video
        </Button>
      }
    >
      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
        {video.description}
      </p>
    </ContentCard>
  );
}
