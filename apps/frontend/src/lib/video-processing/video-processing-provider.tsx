import { useState, type ReactNode } from "react";
import { VideoProcessingContext } from "./context";

export function VideoProcessingProvider({ children }: { children: ReactNode }) {
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <VideoProcessingContext.Provider value={{ isProcessing, setIsProcessing }}>
      {children}
    </VideoProcessingContext.Provider>
  );
}
