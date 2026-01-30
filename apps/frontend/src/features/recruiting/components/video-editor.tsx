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
import { LinkIcon, VideoIcon } from "lucide-react";
import type { ReactNode } from "react";
import { extractYouTubeId } from "./utils/extract-youtube-id";

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
  const videoId = extractYouTubeId(videoUrl);

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
          <div className="rounded-xl overflow-clip bg-black/5 dark:bg-white/5">
            <div className="flex items-center gap-1 px-3 py-1 border-b bg-background">
              <LinkIcon className="size-3.5 text-brand" />
              <Input
                autoComplete="off"
                autoFocus
                value={videoUrl}
                onChange={(e) => {
                  onVideoUrlChange(e.target.value);
                  onErrorClear?.();
                }}
                unstyled
                placeholder="https://www.youtube.com/watch?v=..."
                className="sm:text-sm flex-1"
              />
            </div>
            {videoId ? (
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="Recruiting video preview"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No video found</EmptyTitle>
                </EmptyHeader>
                <EmptyContent className="mt-4">
                  <EmptyMedia variant="icon">
                    <VideoIcon className="size-4 text-brand" />
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
