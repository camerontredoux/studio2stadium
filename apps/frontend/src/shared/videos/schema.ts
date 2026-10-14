import {
  MAX_VIDEO_DURATION_SECONDS,
  readVideoDuration,
  VIDEO_DURATION_MESSAGE,
} from "@/utils/video-duration";
import { z } from "zod";

const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

export const videoUploadSchema = z.object({
  files: z
    .array(z.custom<File>())
    .min(1, "Please select a video")
    .max(1, "Please select one video")
    .refine((files) => files.every((file) => file.size < MAX_VIDEO_SIZE), {
      message: "File size must be less than 500MB",
    })
    .refine((files) => files.every((file) => file.type.startsWith("video/")), {
      message: "Please select a video file",
    })
    .refine(
      async (files) => {
        if (
          files.length !== 1 ||
          files[0].size >= MAX_VIDEO_SIZE ||
          !files[0].type.startsWith("video/")
        )
          return true;
        const duration = await readVideoDuration(files[0]);
        return duration === null || duration <= MAX_VIDEO_DURATION_SECONDS;
      },
      { message: VIDEO_DURATION_MESSAGE },
    ),
});

export type FormValues = z.infer<typeof videoUploadSchema>;
