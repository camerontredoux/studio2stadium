import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTab } from "@/components/ui/tabs";
import { toastManager } from "@/components/ui/toast-manager";
import {
  useAdminDeleteSchoolImage,
  useAdminDeleteSchoolVideo,
  useAdminUploadSchoolImage,
} from "@/features/admin/api/mutations";
import { adminQueries } from "@/features/admin/api/queries";
import { handleApiError } from "@/lib/api/errors";
import type { ApiSchemas } from "@/lib/api/client";
import { useRequestUpload } from "@/shared/images/api/mutations";
import { ImageUploadField } from "@/shared/images/components/image-upload-field";
import { VideoUploadField } from "@/shared/videos/components/video-upload-field";
import { uploadToCloudflare } from "@/utils/upload-to-cloudflare";
import { uploadVideoTus } from "@/utils/upload-video-tus";
import { useQueryClient } from "@tanstack/react-query";
import { ImageIcon, TrashIcon, VideoIcon } from "lucide-react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { TabHandle } from "./types";
import type * as tus from "tus-js-client";

type SchoolImage = ApiSchemas["SchoolsIdResponse"]["images"][number];
type SchoolVideo = ApiSchemas["SchoolsIdResponse"]["videos"][number];

const imageSchema = z.object({
  files: z
    .array(z.custom<File>())
    .min(1, "Please select an image")
    .max(1, "Please select one image")
    .refine((files) => files.every((file) => file.size < 10 * 1024 * 1024), {
      message: "File size must be less than 10MB",
    }),
});

const videoSchema = z.object({
  files: z
    .array(z.custom<File>())
    .min(1, "Please select a video")
    .max(1, "Please select one video")
    .refine(
      (files) => files.every((file) => file.size < 500 * 1024 * 1024),
      { message: "File size must be less than 500MB" },
    )
    .refine(
      (files) => files.every((file) => file.type.startsWith("video/")),
      { message: "Please select a video file" },
    ),
});

type ImageFormData = z.infer<typeof imageSchema>;
type VideoFormData = z.infer<typeof videoSchema>;

interface MediaTabProps {
  username: string;
  images: SchoolImage[];
  videos: SchoolVideo[];
  onStateChange: (state: { isDirty: boolean; isPending: boolean }) => void;
}

function getTusEndpoint(username: string) {
  if (import.meta.env.DEV) {
    return `/api/admin/schools/${username}/videos/tus`;
  }
  return `${import.meta.env.VITE_API_URL}/admin/schools/${username}/videos/tus`;
}

function ExistingMedia({
  images,
  videos,
  username,
  isVideoProcessing,
}: {
  images: SchoolImage[];
  videos: SchoolVideo[];
  username: string;
  isVideoProcessing: boolean;
}) {
  const { mutate: deleteImage, isPending: isDeletingImage } =
    useAdminDeleteSchoolImage(username);
  const { mutate: deleteVideo, isPending: isDeletingVideo } =
    useAdminDeleteSchoolVideo(username);

  const items = [
    ...images.map((img) => ({ kind: "image" as const, data: img })),
    ...videos.map((vid) => ({ kind: "video" as const, data: vid })),
  ].sort(
    (a, b) =>
      new Date(b.data.createdAt).getTime() -
      new Date(a.data.createdAt).getTime(),
  );

  if (items.length === 0 && !isVideoProcessing) {
    return (
      <div className="text-muted-foreground py-4 text-center text-sm">
        No media uploaded yet
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {isVideoProcessing && (
        <div className="bg-muted flex aspect-square items-center justify-center rounded-md">
          <div className="flex flex-col items-center gap-2">
            <Spinner className="size-5" />
            <span className="text-muted-foreground text-xs">Processing</span>
          </div>
        </div>
      )}
      {items.map((item) => (
        <div key={item.data.id} className="group relative aspect-square">
          {item.kind === "image" ? (
            <img
              src={item.data.mediaUrl ?? ""}
              alt=""
              className="size-full rounded-md object-cover"
            />
          ) : (
            <div className="bg-muted flex size-full items-center justify-center rounded-md">
              {item.data.thumbnail ? (
                <img
                  src={item.data.thumbnail}
                  alt=""
                  className="size-full rounded-md object-cover"
                />
              ) : (
                <VideoIcon className="text-muted-foreground size-6" />
              )}
            </div>
          )}
          <Button
            variant="destructive"
            size="icon-xs"
            className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100"
            disabled={isDeletingImage || isDeletingVideo}
            onClick={() => {
              if (item.kind === "image") {
                deleteImage(
                  { params: { path: { username, id: item.data.id } } },
                  {
                    onSuccess: () =>
                      toastManager.add({
                        title: "Image deleted",
                        type: "success",
                      }),
                    onError: () =>
                      toastManager.add({
                        title: "Failed to delete image",
                        type: "error",
                      }),
                  },
                );
              } else {
                deleteVideo(
                  { params: { path: { username, id: item.data.id } } },
                  {
                    onSuccess: () =>
                      toastManager.add({
                        title: "Video deleted",
                        type: "success",
                      }),
                    onError: () =>
                      toastManager.add({
                        title: "Failed to delete video",
                        type: "error",
                      }),
                  },
                );
              }
            }}
          >
            <TrashIcon className="size-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}

export const MediaTab = forwardRef<TabHandle, MediaTabProps>(
  function MediaTab({ username, images, videos, onStateChange }, ref) {
    const [uploadType, setUploadType] = useState<"image" | "video">("image");
    const queryClient = useQueryClient();

    const { mutate: requestUpload, isPending: isRequesting } =
      useRequestUpload();
    const { mutate: uploadImage, isPending: isSavingImage } =
      useAdminUploadSchoolImage(username);
    const [imageUploading, setImageUploading] = useState(false);
    const [imageProgress, setImageProgress] = useState(0);
    const isImageLoading = imageUploading || isRequesting || isSavingImage;

    const imageForm = useForm<ImageFormData>({
      resolver: zodResolver(imageSchema),
      defaultValues: { files: [] },
    });

    const videoForm = useForm<VideoFormData>({
      resolver: zodResolver(videoSchema),
      defaultValues: { files: [] },
    });

    const [videoUploading, setVideoUploading] = useState(false);
    const [videoProgress, setVideoProgress] = useState(0);
    const tusRef = useRef<tus.Upload | null>(null);

    const [isVideoProcessing, setIsVideoProcessing] = useState(false);
    const videoCountAtUpload = useRef<number | null>(null);

    const cfVideoCount = videos.filter((v) => v.type === "cloudflare").length;
    useEffect(() => {
      if (
        isVideoProcessing &&
        videoCountAtUpload.current !== null &&
        cfVideoCount > videoCountAtUpload.current
      ) {
        setIsVideoProcessing(false);
        videoCountAtUpload.current = null;
        toastManager.add({
          title: "Video ready",
          description: "The video has been processed.",
          type: "success",
        });
      }
    }, [cfVideoCount, isVideoProcessing]);

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startPolling = useCallback(() => {
      if (pollRef.current) return;
      pollRef.current = setInterval(() => {
        queryClient.invalidateQueries({
          queryKey: adminQueries.schoolEvents(username).queryKey,
        });
      }, 5000);
    }, [queryClient, username]);

    const stopPolling = useCallback(() => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, []);

    useEffect(() => {
      if (isVideoProcessing) {
        startPolling();
      } else {
        stopPolling();
      }
      return stopPolling;
    }, [isVideoProcessing, startPolling, stopPolling]);

    const hasImageFile = imageForm.watch("files").length > 0;
    const hasVideoFile = videoForm.watch("files").length > 0;

    const isLoading = isImageLoading || videoUploading;
    const isDirty =
      uploadType === "image" ? hasImageFile : hasVideoFile;

    const onImageSubmit = (data: ImageFormData) => {
      const file = data.files[0];
      setImageProgress(0);

      requestUpload(
        { body: { contentType: file.type, type: "feed" } },
        {
          onError: handleApiError({
            onError: (error) => {
              toastManager.add({
                title: "Error",
                description: error.message,
                type: "error",
              });
            },
          }),
          onSuccess: async (response) => {
            setImageUploading(true);
            uploadToCloudflare(response.url, file, (percent) => {
              setImageProgress(percent);
            })
              .then(() => {
                uploadImage(
                  {
                    params: { path: { username } },
                    body: { key: response.key },
                  },
                  {
                    onSuccess: () => {
                      toastManager.add({
                        title: "Image uploaded",
                        type: "success",
                      });
                      imageForm.reset();
                    },
                    onError: () => {
                      toastManager.add({
                        title: "Failed to save image",
                        type: "error",
                      });
                    },
                  },
                );
              })
              .catch(() => {
                toastManager.add({
                  title: "Failed to upload image",
                  type: "error",
                });
              })
              .finally(() => {
                setImageUploading(false);
              });
          },
        },
      );
    };

    const onVideoSubmit = (data: VideoFormData) => {
      const file = data.files[0];
      setVideoProgress(0);
      setVideoUploading(true);

      const upload = uploadVideoTus({
        file,
        endpoint: getTusEndpoint(username),
        onProgress: setVideoProgress,
        onSuccess: () => {
          toastManager.add({
            title: "Upload complete",
            description: "Video is being processed.",
            type: "success",
          });
          videoCountAtUpload.current = cfVideoCount;
          setIsVideoProcessing(true);
          setVideoUploading(false);
          setVideoProgress(0);
          videoForm.reset();
          tusRef.current = null;
        },
        onError: (error) => {
          toastManager.add({
            title: "Upload failed",
            description: error.message,
            type: "error",
          });
          setVideoUploading(false);
          tusRef.current = null;
        },
      });

      tusRef.current = upload;
      upload.start();
    };

    useImperativeHandle(ref, () => ({
      save: () => {
        if (uploadType === "image") {
          imageForm.handleSubmit(onImageSubmit)();
        } else {
          videoForm.handleSubmit(onVideoSubmit)();
        }
      },
      isDirty,
      isPending: isLoading,
    }));

    useEffect(() => {
      onStateChange({ isDirty, isPending: isLoading });
    }, [isDirty, isLoading, onStateChange]);

    return (
      <div className="flex h-full flex-col gap-4 overflow-y-auto">
        <ExistingMedia
          images={images}
          videos={videos}
          username={username}
          isVideoProcessing={isVideoProcessing}
        />

        <div className="border-t pt-4">
          <Tabs
            value={uploadType}
            onValueChange={(v) => setUploadType(v as "image" | "video")}
          >
            <TabsList>
              <TabsTab value="image">
                <ImageIcon className="mr-1.5 size-3.5" />
                Upload Image
              </TabsTab>
              <TabsTab value="video">
                <VideoIcon className="mr-1.5 size-3.5" />
                Upload Video
              </TabsTab>
            </TabsList>

            <TabsContent value="image" className="mt-3">
              <FormProvider {...imageForm}>
                <form
                  id="admin-image-form"
                  onSubmit={(e) =>
                    imageForm.handleSubmit(onImageSubmit)(e)
                  }
                >
                  <Controller
                    control={imageForm.control}
                    name="files"
                    render={({ field }) => (
                      <Field>
                        <ImageUploadField
                          value={field.value}
                          onValueChange={field.onChange}
                          isLoading={isImageLoading}
                          progress={imageProgress}
                        />
                      </Field>
                    )}
                  />
                </form>
              </FormProvider>
            </TabsContent>

            <TabsContent value="video" className="mt-3">
              <FormProvider {...videoForm}>
                <form
                  id="admin-video-form"
                  onSubmit={(e) =>
                    videoForm.handleSubmit(onVideoSubmit)(e)
                  }
                >
                  <Controller
                    control={videoForm.control}
                    name="files"
                    render={({ field }) => (
                      <Field>
                        <VideoUploadField
                          value={field.value}
                          onValueChange={field.onChange}
                          isLoading={videoUploading}
                          progress={videoProgress}
                        />
                      </Field>
                    )}
                  />
                </form>
              </FormProvider>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  },
);
