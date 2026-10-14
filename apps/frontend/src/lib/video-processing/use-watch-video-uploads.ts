import { toastManager } from "@/components/ui/toast-manager";
import { dancerQueries } from "@/features/dancer/api/queries";
import { schoolQueries } from "@/features/school/api/queries";
import { client } from "@/lib/api/client";
import { useSession } from "@/lib/session/hooks/use-session";
import { videoQueries } from "@/shared/videos/api/queries";
import { videoUploadErrorMessage } from "@/utils/video-duration";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { uploadOutcome } from "./pending-uploads";
import { useVideoProcessing } from "./use-video-processing";

const POLL_INTERVAL_MS = 5000;

/**
 * Polls each upload the user sent until Cloudflare finishes processing it,
 * then shows the result. Each upload is tracked on its own, so a second
 * upload's result is not lost when the first one finishes.
 */
export function useWatchVideoUploads() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { username, type } = useSession();
  const { pendingUploads, untrackUpload } = useVideoProcessing();
  const handled = useRef(new Set<string>());

  const results = useQueries({
    queries: pendingUploads.map((mediaId) => ({
      queryKey: ["video-uploads", mediaId],
      queryFn: async () => {
        const { data, response } = await client.GET(
          "/videos/uploads/{mediaId}",
          { params: { path: { mediaId } } },
        );
        // Deleted, or it belongs to another account on this browser.
        if (response.status === 404) return null;
        if (!data) throw new Error("Could not check the video upload");
        return data;
      },
      refetchInterval: POLL_INTERVAL_MS,
    })),
  });

  useEffect(() => {
    results.forEach((result, index) => {
      const mediaId = pendingUploads[index];
      if (!mediaId || !result.isSuccess || handled.current.has(mediaId)) {
        return;
      }

      const upload = result.data;
      const outcome = uploadOutcome(upload);
      if (outcome === "processing") return;

      handled.current.add(mediaId);
      untrackUpload(mediaId);
      queryClient.invalidateQueries({
        queryKey: videoQueries.permissions().queryKey,
      });

      if (outcome === "ready") {
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
      } else if (outcome === "failed") {
        toastManager.add({
          title: "Video processing failed",
          description: videoUploadErrorMessage(
            upload?.errorMessage || "Please try uploading again.",
          ),
          type: "error",
        });
      }
    });
  }, [
    results,
    pendingUploads,
    untrackUpload,
    queryClient,
    navigate,
    username,
    type,
  ]);
}
