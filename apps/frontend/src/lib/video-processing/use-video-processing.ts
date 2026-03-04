import { useContext } from "react";
import { VideoProcessingContext } from "./context";

export function useVideoProcessing() {
  const context = useContext(VideoProcessingContext);
  if (!context) {
    throw new Error(
      "useVideoProcessing must be used within VideoProcessingProvider",
    );
  }
  return context;
}
