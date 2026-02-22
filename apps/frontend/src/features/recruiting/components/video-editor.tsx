import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field } from "@/components/ui/field";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { getYouTubeId } from "@/utils/get-youtube-id";
import { LinkIcon, VideoIcon } from "lucide-react";
import type { ReactNode } from "react";
interface VideoEditorProps {
  videoUrl: string;
  onVideoUrlChange: (url: string) => void;
  videoError?: string;
  onErrorClear?: () => void;
  headerAction?: ReactNode;
}

export function VideoEditor({
  videoUrl,
  onVideoUrlChange,
  videoError,
  onErrorClear,
  headerAction,
}: VideoEditorProps) {
  const videoId = getYouTubeId(videoUrl);

  return (
    <Frame>
      <FrameHeader>
        <FrameTitle className="flex items-center gap-2">
          Recruiting Video
          {headerAction && <div className="ml-auto">{headerAction}</div>}
        </FrameTitle>
      </FrameHeader>
      <FramePanel className="p-0!">
        <Field invalid={!!videoError}>
          <div className="overflow-clip rounded-xl bg-black/5 dark:bg-white/5">
            <div className="bg-background flex items-center gap-1 border-b px-3 py-1">
              <LinkIcon className="text-brand size-3.5" />
              <Input
                autoComplete="off"
                value={videoUrl}
                onChange={(e) => {
                  onVideoUrlChange(e.target.value);
                  onErrorClear?.();
                }}
                unstyled
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 sm:text-sm"
              />
            </div>
            {videoId ? (
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="Recruiting video preview"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No video found</EmptyTitle>
                </EmptyHeader>
                <EmptyContent className="mt-4">
                  <EmptyMedia variant="icon">
                    <VideoIcon className="text-brand size-4" />
                  </EmptyMedia>
                  <EmptyDescription>
                    Please enter a valid YouTube URL
                  </EmptyDescription>
                </EmptyContent>
              </Empty>
            )}
          </div>
        </Field>
      </FramePanel>
    </Frame>
  );
}
