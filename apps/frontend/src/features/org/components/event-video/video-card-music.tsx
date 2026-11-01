import { MusicNotesIcon } from "@phosphor-icons/react";

import { Button } from "@/components/event/button";
import { Icon } from "@/components/event/icon";
import type { EventVideo } from "@/features/org/api/video-queries";

/**
 * The music slot on a video card. It always takes one control's height, so
 * cards with and without a track line up: the player when there is a track,
 * otherwise "Add music" for editors or an empty, disabled player.
 */
export function VideoCardMusic({
  video,
  onAddMusic,
}: {
  video: EventVideo;
  onAddMusic?: () => void;
}) {
  if (video.audioUrl) {
    return (
      <audio
        controls
        src={video.audioUrl}
        preload="none"
        className="h-(--control-lg) w-full"
      />
    );
  }

  if (onAddMusic) {
    return (
      <Button
        size="lg"
        className="w-full"
        aria-label={`Add music to ${video.title}`}
        onClick={onAddMusic}
      >
        <Icon icon={MusicNotesIcon} />
        Add music
      </Button>
    );
  }

  return (
    <audio
      controls
      aria-label="No music for this video"
      aria-disabled="true"
      tabIndex={-1}
      className="pointer-events-none h-(--control-lg) w-full opacity-40"
    />
  );
}
