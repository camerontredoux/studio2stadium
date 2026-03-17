import { VideoLibraryPage } from "@/features/admin/video-library";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/(routes)/admin/video-library")({
  component: VideoLibraryPage,
});
