import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { client, type ApiSchemas } from "@/lib/api/client";
import { toastManager } from "@/components/ui/toast-manager";

// Types
export type VideoCategory =
  ApiSchemas["OrgsIdEventsIdVideocategoriesResponse"][number];

export type EventVideo = ApiSchemas["OrgsIdEventsIdVideosResponse"][number];

export interface EventVideoGroup {
  category: VideoCategory;
  videos: EventVideo[];
}

// Helpers
async function postJson<T>(path: string, body: unknown): Promise<T> {
  const raw = client as unknown as {
    POST: (
      p: string,
      opts: { body: unknown },
    ) => Promise<{ data: T; error?: unknown }>;
  };
  const res = await raw.POST(path, { body });
  if (res.error) throw res.error;
  return res.data;
}

// Query keys & options
export const videoQueries = {
  categories: (slug: string, eventId: string) =>
    queryOptions({
      queryKey: ["orgs", slug, "events", eventId, "video-categories"],
      queryFn: () =>
        client
          .GET("/orgs/{slug}/events/{id}/video-categories", {
            params: { path: { slug, id: eventId } },
          })
          .then((r) => r.data!),
      enabled: !!eventId,
    }),

  videos: (slug: string, eventId: string) =>
    queryOptions({
      queryKey: ["orgs", slug, "events", eventId, "videos"],
      queryFn: () =>
        client
          .GET("/orgs/{slug}/events/{id}/videos", {
            params: { path: { slug, id: eventId } },
          })
          .then((r) => r.data!),
      enabled: !!eventId,
    }),
};

// Mutations
export function useCreateCategory(slug: string, eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string }) =>
      postJson<VideoCategory>(
        `/orgs/${slug}/events/${eventId}/video-categories`,
        body,
      ),
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
  return useMutation({
    mutationFn: async (categoryId: string) => {
      const res = await client.DELETE(
        "/orgs/{slug}/events/{id}/video-categories/{categoryId}",
        { params: { path: { slug, id: eventId, categoryId } } },
      );
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      void qc.invalidateQueries(videoQueries.categories(slug, eventId));
      toastManager.add({ title: "Category deleted", type: "success" });
    },
    onError: () => {
      toastManager.add({
        title: "Cannot delete — category has videos",
        type: "error",
      });
    },
  });
}

export function useCreateVideo(slug: string, eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      title: string;
      categoryId: string;
      youtubeId: string;
      audioKey?: string | null;
      audioFilename?: string | null;
    }) =>
      postJson<EventVideo>(
        `/orgs/${slug}/events/${eventId}/videos`,
        body,
      ),
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
  return useMutation({
    mutationFn: async ({
      videoId,
      ...body
    }: {
      videoId: string;
      title: string;
      categoryId: string;
      youtubeId: string;
      audioKey?: string | null;
      audioFilename?: string | null;
    }) => {
      const res = await client.PATCH(
        "/orgs/{slug}/events/{id}/videos/{videoId}",
        {
          params: { path: { slug, id: eventId, videoId } },
          body,
        },
      );
      if (res.error) throw res.error;
      return res.data;
    },
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
  return useMutation({
    mutationFn: async (videoId: string) => {
      // The spec lists no error responses here, so `error` is typed never.
      const { error } = await client.DELETE(
        "/orgs/{slug}/events/{id}/videos/{videoId}",
        { params: { path: { slug, id: eventId, videoId } } },
      );
      if (error) throw error;
    },
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
  });
}

export function useAudioUploadUrl(slug: string, eventId: string) {
  return useMutation({
    mutationFn: (body: { contentType: string; filename: string }) =>
      postJson<{ key: string; url: string }>(
        `/orgs/${slug}/events/${eventId}/videos/audio-upload-url`,
        body,
      ),
    onError: () => {
      toastManager.add({
        title: "Failed to get audio upload URL",
        type: "error",
      });
    },
  });
}
