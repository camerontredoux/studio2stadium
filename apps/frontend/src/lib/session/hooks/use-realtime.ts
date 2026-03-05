import { toastManager } from "@/components/ui/toast-manager";
import { dancerQueries } from "@/features/dancer/api/queries";
import { schoolQueries } from "@/features/school/api/queries";
import { useVideoProcessing } from "@/lib/video-processing";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSession } from "./use-session";

type RealtimeEvent =
  | { type: "video.ready"; videoId: string }
  | { type: "video.failed"; errorMessage: string };

/**
 * Hook that connects to the SSE endpoint for realtime notifications.
 * Uses BroadcastChannel to dedupe connections across tabs - only one tab
 * maintains the SSE connection and broadcasts events to others.
 */
export function useRealtime() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id, username, type } = useSession();
  const { isProcessing, setIsProcessing } = useVideoProcessing();

  useEffect(() => {
    if (!isProcessing) return;

    const handleEvent = (event: RealtimeEvent) => {
      switch (event.type) {
        case "video.ready":
          setIsProcessing(false);
          toastManager.add({
            title: "Video ready",
            description: "Your video has been processed!",
            type: "success",
            actionProps: {
              children: "View",
              onClick: () =>
                navigate({
                  to: type === "school" ? "/explore/$username" : "/$username",
                  params: { username },
                }),
            },
          });
          queryClient.invalidateQueries({
            queryKey:
              type === "school"
                ? schoolQueries.profile(username).queryKey
                : dancerQueries.profile(username).queryKey,
          });
          break;

        case "video.failed":
          setIsProcessing(false);
          toastManager.add({
            title: "Video processing failed",
            description: event.errorMessage || "Please try uploading again.",
            type: "error",
          });
          break;
      }
    };

    const url = `${import.meta.env.VITE_API_URL}/notifications/stream`;
    const eventSource = new EventSource(url, { withCredentials: true });
    console.log("[Realtime] SSE connection established");

    eventSource.addEventListener("video.ready", (e) => {
      console.log("[Realtime] Video ready event received");
      handleEvent({ type: "video.ready", videoId: JSON.parse(e.data).videoId });
      eventSource.close();
      console.log("[Realtime] Closed SSE connection");
    });

    eventSource.addEventListener("video.failed", (e) => {
      console.log("[Realtime] Video failed event received");
      handleEvent({
        type: "video.failed",
        errorMessage: JSON.parse(e.data).errorMessage,
      });
      eventSource.close();
      console.log("[Realtime] Closed SSE connection");
    });

    return () => {
      eventSource.close();
      console.log("[Realtime] Closed SSE connection");
    };
  }, [
    isProcessing,
    queryClient,
    navigate,
    id,
    username,
    type,
    setIsProcessing,
  ]);
}
