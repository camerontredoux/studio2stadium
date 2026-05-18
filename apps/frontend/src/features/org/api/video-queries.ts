import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { client } from "@/lib/api/client";
import { toastManager } from "@/components/ui/toast-manager";

// Types
export interface VideoCategory {
  id: string;
  eventId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
}

export interface EventVideo {
  id: string;
  eventId: string;
  categoryId: string;
  title: string;
  youtubeId: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  audioKey?: string | null;
  audioFilename?: string | null;
  audioUrl?: string | null;
}

export interface EventVideoGroup {
  category: VideoCategory;
  videos: EventVideo[];
}

// Helpers
async function fetchJson<T>(path: string): Promise<T> {
  const res = await (
    client as unknown as Record<string, (p: string) => Promise<{ data: T }>>
  )["GET"](path);
  return res.data;
}

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

async function patchJson<T>(path: string, body: unknown): Promise<T> {
  const raw = client as unknown as {
    PATCH: (
      p: string,
      opts: { body: unknown },
    ) => Promise<{ data: T; error?: unknown }>;
  };
  const res = await raw.PATCH(path, { body });
  if (res.error) throw res.error;
  return res.data;
}

async function deleteJson(path: string): Promise<void> {
  const raw = client as unknown as {
    DELETE: (p: string) => Promise<{ error?: unknown }>;
  };
  const res = await raw.DELETE(path);
  if (res.error) throw res.error;
}

// Query keys & options
export const videoQueries = {
  categories: (slug: string, eventId: string) =>
    queryOptions({
      queryKey: ["orgs", slug, "events", eventId, "video-categories"],
      queryFn: () =>
        fetchJson<VideoCategory[]>(
          `/orgs/${slug}/events/${eventId}/video-categories`,
        ),
      enabled: !!eventId,
    }),

  videos: (slug: string, eventId: string) =>
    queryOptions({
      queryKey: ["orgs", slug, "events", eventId, "videos"],
      queryFn: () =>
        fetchJson<EventVideo[]>(`/orgs/${slug}/events/${eventId}/videos`),
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
    mutationFn: (categoryId: string) =>
      deleteJson(
        `/orgs/${slug}/events/${eventId}/video-categories/${categoryId}`,
      ),
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
    mutationFn: ({
      videoId,
      ...body
    }: {
      videoId: string;
      title: string;
      categoryId: string;
      youtubeId: string;
      audioKey?: string | null;
      audioFilename?: string | null;
    }) =>
      patchJson<EventVideo>(
        `/orgs/${slug}/events/${eventId}/videos/${videoId}`,
        body,
      ),
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
    mutationFn: (videoId: string) =>
      deleteJson(`/orgs/${slug}/events/${eventId}/videos/${videoId}`),
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
