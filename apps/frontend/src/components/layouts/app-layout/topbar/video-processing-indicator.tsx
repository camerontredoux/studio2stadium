import { Spinner } from "@/components/ui/spinner";
import { useVideoProcessing } from "@/lib/video-processing";

export function VideoProcessingIndicator() {
  const { isProcessing } = useVideoProcessing();

  if (!isProcessing) {
    return null;
  }

  return (
    <div className="text-muted-foreground hidden items-center gap-2 text-sm sm:flex">
      <Spinner className="size-4" />
      <span>Processing video...</span>
    </div>
  );
}
