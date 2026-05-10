import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Frame, FramePanel } from "@/components/ui/frame";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import type { ApiSchemas } from "@/lib/api/client";
import { useSession } from "@/lib/session";
import { getYouTubeId } from "@/utils/get-youtube-id";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useDeleteLibraryVideo } from "../api/mutations";
import { queries } from "../api/queries";

type Video = ApiSchemas["LibraryResponse"][number]["videos"][number];

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  const id = getYouTubeId(video.url);
  const session = useSession();
  const isAdmin = session.role === "admin";
  const queryClient = useQueryClient();
  const { mutate: deleteVideo, isPending } = useDeleteLibraryVideo();
  const [alertOpen, setAlertOpen] = useState(false);

  const handleDelete = () => {
    deleteVideo(
      { params: { path: { id: video.id } } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries(queries.videos());
          setAlertOpen(false);
          toastManager.add({
            title: "Deleted",
            description: "Video removed from library",
            type: "success",
          });
        },
        onError: () => {
          setAlertOpen(false);
          toastManager.add({
            title: "Error",
            description: "Failed to delete video",
            type: "error",
          });
        },
      },
    );
  };

  return (
    <Frame compact className="group flex flex-col [content-visibility:auto]">
      <FramePanel side="inset" className="flex flex-col">
        <Dialog>
          <DialogTrigger className="block w-full">
            <div className="relative aspect-video w-full cursor-pointer">
              <img
                src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
                alt={video.title}
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-black/80 to-transparent" />
              {video.category && (
                <Badge variant="brand" className="absolute top-2.5 left-2.5">
                  {video.category}
                </Badge>
              )}
            </div>
          </DialogTrigger>
          <DialogContent
            showCloseButton={false}
            className="max-w-7xl overflow-clip"
          >
            <div className="sm:max-h-[calc(100dvh-8rem)]">
              <iframe
                src={video.url}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="aspect-video h-full w-full"
              />
            </div>
            <DialogFooter>
              {isAdmin && (
                <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                  <AlertDialogTrigger render={<Button variant="destructive" />}>
                    Delete
                  </AlertDialogTrigger>
                  <AlertDialogPopup>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Video</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{video.title}"? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogClose
                        render={<Button variant="ghost" disabled={isPending} />}
                      >
                        Cancel
                      </AlertDialogClose>
                      <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isPending}
                      >
                        {isPending ? <Spinner label="Deleting..." /> : "Delete"}
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogPopup>
                </AlertDialog>
              )}
              <DialogClose render={<Button variant="secondary" />}>
                Close
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="from-brand/10 via-background to-background group-hover:from-brand/8 group-hover:via-brand/4 relative flex flex-1 flex-col gap-2.5 bg-linear-to-br p-3 transition-colors duration-75 sm:p-4">
          <div
            className="bg-brand pointer-events-none absolute inset-0 opacity-[0.12] dark:opacity-[0.06]"
            aria-hidden
          />
          <div className="flex flex-1 flex-col gap-1.5">
            <h3
              title={video.title}
              aria-label={video.title}
              className="group-hover:text-brand truncate text-sm leading-snug font-semibold transition-colors"
            >
              {video.title}
            </h3>
          </div>
        </div>
      </FramePanel>
    </Frame>
  );
}
