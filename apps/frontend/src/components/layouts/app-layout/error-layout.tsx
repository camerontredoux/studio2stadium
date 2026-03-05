import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { VideoProcessingProvider } from "@/lib/video-processing";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { CircleAlertIcon } from "lucide-react";
import { AppLayout } from "./app-layout";

export function ErrorComponent({ error }: ErrorComponentProps) {
  return (
    <VideoProcessingProvider>
      <AppLayout>
        <Alert variant="error">
          <CircleAlertIcon />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>An error occured. {error.message}</AlertDescription>
        </Alert>
      </AppLayout>
    </VideoProcessingProvider>
  );
}
