import { Button } from "@/components/ui/button";
import { LinkIcon } from "lucide-react";

interface VideoPreviewProps {
  videoId: string;
  videoUrl: string;
  onEdit: () => void;
}

export function VideoPreview({ videoId, videoUrl, onEdit }: VideoPreviewProps) {
  return (
    <div className="w-full self-start overflow-clip rounded-xl border bg-black/5 lg:w-80 lg:shrink-0 dark:bg-white/5">
      <div className="aspect-video">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title="Recruiting video preview"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
      <div className="flex items-center gap-2 px-3 py-2 text-sm">
        <LinkIcon className="text-brand size-3.5 shrink-0" />
        <span className="text-muted-foreground flex-1 truncate">
          {videoUrl}
        </span>
        <Button variant="ghost" size="xs" className="shrink-0" onClick={onEdit}>
          Edit
        </Button>
      </div>
    </div>
  );
}
