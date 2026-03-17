import { getYouTubeId } from "@/utils/get-youtube-id";
import { z } from "zod";

export const libraryVideoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  youtubeUrl: z
    .string()
    .min(1, "YouTube URL is required")
    .refine((url) => getYouTubeId(url) !== null, "Invalid YouTube URL"),
});

export type LibraryVideoFormData = z.infer<typeof libraryVideoSchema>;
