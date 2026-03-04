import { toastManager } from "@/components/ui/toast-manager";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

type RealtimeEvent =
  | { type: "video.ready"; videoId: string }
  | { type: "video.failed"; errorMessage: string };

/**
 * Hook that connects to the SSE endpoint for realtime notifications.
 * Automatically shows toasts when video processing completes.
 */
export function useRealtime() {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const url = `${import.meta.env.VITE_API_URL}/notifications/stream`;

    const eventSource = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("connected", () => {
      console.log("[Realtime] Connected to SSE");
    });

    eventSource.addEventListener("video.ready", (event) => {
      const data = JSON.parse(event.data) as Extract<
        RealtimeEvent,
        { type: "video.ready" }
      >;

      toastManager.add({
        title: "Video ready",
        description: "Your video has been processed and is now live!",
        type: "success",
      });

      // Invalidate videos query if viewing profile
      // queryClient.invalidateQueries({ queryKey: dan });

      console.log("[Realtime] Video ready:", data.videoId);
    });

    eventSource.addEventListener("video.failed", (event) => {
      const data = JSON.parse(event.data) as Extract<
        RealtimeEvent,
        { type: "video.failed" }
      >;

      toastManager.add({
        title: "Video processing failed",
        description: data.errorMessage || "Please try uploading again.",
        type: "error",
      });

      console.log("[Realtime] Video failed:", data.errorMessage);
    });

    eventSource.onerror = () => {
      console.log("[Realtime] SSE connection error, will retry...");
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [queryClient]);
}
