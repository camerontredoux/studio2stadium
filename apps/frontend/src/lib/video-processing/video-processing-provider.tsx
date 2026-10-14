import { useCallback, useEffect, useState, type ReactNode } from "react";
import { VideoProcessingContext } from "./context";
import { readPendingUploads, STORAGE_KEY } from "./pending-uploads";

export function VideoProcessingProvider({ children }: { children: ReactNode }) {
  const [pendingUploads, setPendingUploads] = useState(readPendingUploads);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingUploads));
  }, [pendingUploads]);

  const trackUpload = useCallback((mediaId: string) => {
    setPendingUploads((ids) =>
      ids.includes(mediaId) ? ids : [...ids, mediaId],
    );
  }, []);

  const untrackUpload = useCallback((mediaId: string) => {
    setPendingUploads((ids) => ids.filter((id) => id !== mediaId));
  }, []);

  return (
    <VideoProcessingContext.Provider
      value={{
        isProcessing: pendingUploads.length > 0,
        pendingUploads,
        trackUpload,
        untrackUpload,
      }}
    >
      {children}
    </VideoProcessingContext.Provider>
  );
}
