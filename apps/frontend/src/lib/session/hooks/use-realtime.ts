import { toastManager } from "@/components/ui/toast-manager";
import { dancerQueries } from "@/features/dancer/api/queries";
import { schoolQueries } from "@/features/school/api/queries";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSession } from "./use-session";

type RealtimeEvent =
  | { type: "video.ready"; videoId: string }
  | { type: "video.failed"; errorMessage: string };

type BroadcastMessage =
  | { type: "leader-check" }
  | { type: "leader-exists" }
  | { type: "event"; event: RealtimeEvent };

const LEADER_ELECTION_DELAY = 100;
const HEARTBEAT_INTERVAL = 5000;
const SSE_RECONNECT_DELAY = 1000;

/**
 * Hook that connects to the SSE endpoint for realtime notifications.
 * Uses BroadcastChannel to dedupe connections across tabs - only one tab
 * maintains the SSE connection and broadcasts events to others.
 */
export function useRealtime() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id, username, type } = useSession();

  useEffect(() => {
    // User-specific channel so each user's tabs manage their own leader election
    const bc = new BroadcastChannel(`s2s-realtime:${id}`);
    let isLeader = false;
    let eventSource: EventSource | null = null;
    let electionTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleEvent = (event: RealtimeEvent) => {
      switch (event.type) {
        case "video.ready":
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
          toastManager.add({
            title: "Video processing failed",
            description: event.errorMessage || "Please try uploading again.",
            type: "error",
          });
          break;
      }
    };

    const setupSSE = () => {
      const url = `${import.meta.env.VITE_API_URL}/notifications/stream`;
      eventSource = new EventSource(url, { withCredentials: true });

      eventSource.addEventListener("connected", () => {
        console.log("[Realtime] Leader: connected to SSE");
      });

      eventSource.addEventListener("video.ready", (e) => {
        const event: RealtimeEvent = {
          type: "video.ready",
          videoId: JSON.parse(e.data).videoId,
        };
        bc.postMessage({ type: "event", event });
        handleEvent(event);
      });

      eventSource.addEventListener("video.failed", (e) => {
        const event: RealtimeEvent = {
          type: "video.failed",
          errorMessage: JSON.parse(e.data).errorMessage,
        };
        bc.postMessage({ type: "event", event });
        handleEvent(event);
      });

      eventSource.onerror = () => {
        console.log("[Realtime] Leader: SSE error, reconnecting...");
        eventSource?.close();
        eventSource = null;
        setTimeout(() => {
          if (isLeader) {
            setupSSE();
          }
        }, SSE_RECONNECT_DELAY);
      };
    };

    const becomeLeader = () => {
      isLeader = true;
      console.log("[Realtime] Became leader");
      setupSSE();
    };

    const tryBecomeLeader = () => {
      // Clear any pending election
      if (electionTimeout) clearTimeout(electionTimeout);

      // Ask if there's already a leader
      bc.postMessage({ type: "leader-check" });

      // If no one responds, become the leader
      electionTimeout = setTimeout(() => {
        becomeLeader();
      }, LEADER_ELECTION_DELAY);
    };

    bc.onmessage = (e: MessageEvent<BroadcastMessage>) => {
      switch (e.data.type) {
        case "leader-check":
          // Another tab is checking for leader
          if (isLeader) {
            bc.postMessage({ type: "leader-exists" });
          }
          break;

        case "leader-exists":
          // A leader exists, cancel our election
          if (electionTimeout) {
            clearTimeout(electionTimeout);
            electionTimeout = null;
          }
          console.log("[Realtime] Following existing leader");
          break;

        case "event":
          // Received event from leader (followers only)
          if (!isLeader) {
            handleEvent(e.data.event);
          }
          break;
      }
    };

    // Start leader election
    tryBecomeLeader();

    // Heartbeat: followers periodically check if leader is alive
    const heartbeat = setInterval(() => {
      if (!isLeader) {
        tryBecomeLeader();
      }
    }, HEARTBEAT_INTERVAL);

    return () => {
      clearInterval(heartbeat);
      if (electionTimeout) clearTimeout(electionTimeout);
      if (eventSource) eventSource.close();
      bc.close();
    };
  }, [queryClient, navigate, id, username, type]);
}
