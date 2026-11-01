import { createContext } from "react";

export interface VideoProcessingContextValue {
  isProcessing: boolean;
  pendingUploads: string[];
  trackUpload: (mediaId: string) => void;
  untrackUpload: (mediaId: string) => void;
}

export const VideoProcessingContext =
  createContext<VideoProcessingContextValue | null>(null);
