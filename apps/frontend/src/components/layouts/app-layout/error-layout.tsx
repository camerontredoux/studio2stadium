import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { VideoProcessingProvider } from "@/lib/video-processing";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { CircleAlertIcon } from "lucide-react";
import { AppLayout } from "./app-layout";

export function ErrorComponent({ error }: ErrorComponentProps) {
  return (
    <VideoProcessingProvider>
      <AppLayout>
        <Alert>
          <CircleAlertIcon />
          <AlertTitle>An error occured</AlertTitle>
          <AlertDescription>An error occured. {error.message}</AlertDescription>
        </Alert>
      </AppLayout>
    </VideoProcessingProvider>
  );
}
