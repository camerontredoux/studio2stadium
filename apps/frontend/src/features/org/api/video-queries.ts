import { useQueryClient } from "@tanstack/react-query";
import { $api, type ApiSchemas } from "@/lib/api/client";
import { toastManager } from "@/components/ui/toast-manager";

// Types
export type VideoCategory =
  ApiSchemas["OrgsIdEventsIdVideocategoriesResponse"][number];

export type EventVideo = ApiSchemas["OrgsIdEventsIdVideosResponse"][number];

export interface EventVideoGroup {
  category: VideoCategory;
  videos: EventVideo[];
}

// Query keys & options
export const videoQueries = {
  categories: (slug: string, eventId: string) =>
    $api.queryOptions(
      "get",
      "/orgs/{slug}/events/{id}/video-categories",
      { params: { path: { slug, id: eventId } } },
      { enabled: !!eventId },
    ),

  videos: (slug: string, eventId: string) =>
    $api.queryOptions(
      "get",
      "/orgs/{slug}/events/{id}/videos",
      { params: { path: { slug, id: eventId } } },
      { enabled: !!eventId },
    ),
};

// Mutations
export function useCreateCategory(slug: string, eventId: string) {
  const qc = useQueryClient();
  return $api.useMutation("post", "/orgs/{slug}/events/{id}/video-categories", {
    onSuccess: () => {
      void qc.invalidateQueries(videoQueries.categories(slug, eventId));
      toastManager.add({ title: "Category created", type: "success" });
    },
    onError: () => {
      toastManager.add({
        title: "Failed to create category",
        type: "error",
      });
    },
  });
}

export function useDeleteCategory(slug: string, eventId: string) {
  const qc = useQueryClient();
  return $api.useMutation(
    "delete",
    "/orgs/{slug}/events/{id}/video-categories/{categoryId}",
    {
      onSuccess: () => {
        void qc.invalidateQueries(videoQueries.categories(slug, eventId));
        toastManager.add({ title: "Category deleted", type: "success" });
      },
      onError: (error) => {
        // The backend answers 409 with this message when videos still use
        // the category; the error body carries no status or code.
        const hasVideos = error?.message?.includes("videos still use it");
        toastManager.add({
          title: hasVideos
            ? "Cannot delete — category has videos"
            : "Failed to delete category",
          type: "error",
        });
      },
    },
  );
}

export function useCreateVideo(slug: string, eventId: string) {
  const qc = useQueryClient();
  return $api.useMutation("post", "/orgs/{slug}/events/{id}/videos", {
    onSuccess: () => {
      void qc.invalidateQueries(videoQueries.videos(slug, eventId));
      toastManager.add({ title: "Video added", type: "success" });
    },
    onError: () => {
      toastManager.add({ title: "Failed to add video", type: "error" });
    },
  });
}

export function useUpdateVideo(slug: string, eventId: string) {
  const qc = useQueryClient();
  return $api.useMutation("patch", "/orgs/{slug}/events/{id}/videos/{videoId}", {
    onSuccess: () => {
      void qc.invalidateQueries(videoQueries.videos(slug, eventId));
      toastManager.add({ title: "Video updated", type: "success" });
    },
    onError: () => {
      toastManager.add({
        title: "Failed to update video",
        type: "error",
      });
    },
  });
}

export function useDeleteVideo(slug: string, eventId: string) {
  const qc = useQueryClient();
  return $api.useMutation(
    "delete",
    "/orgs/{slug}/events/{id}/videos/{videoId}",
    {
      onSuccess: () => {
        void qc.invalidateQueries(videoQueries.videos(slug, eventId));
        toastManager.add({ title: "Video deleted", type: "success" });
      },
      onError: () => {
        toastManager.add({
          title: "Failed to delete video",
          type: "error",
        });
      },
    },
  );
}

export function useAudioUploadUrl() {
  return $api.useMutation(
    "post",
    "/orgs/{slug}/events/{id}/videos/audio-upload-url",
    {
      onError: () => {
        toastManager.add({
          title: "Failed to get audio upload URL",
          type: "error",
        });
      },
    },
  );
}
