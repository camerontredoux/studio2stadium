import { createContext } from "react";

export interface VideoProcessingContextValue {
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
}

export const VideoProcessingContext =
  createContext<VideoProcessingContextValue | null>(null);
