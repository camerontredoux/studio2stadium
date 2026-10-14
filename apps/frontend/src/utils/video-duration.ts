export const MAX_VIDEO_DURATION_SECONDS = 120;
export const VIDEO_DURATION_MESSAGE = "Videos can be up to 2 minutes.";

export function videoUploadErrorMessage(message: string): string {
  return message.includes(
    "The video duration exceeded the constraint set by the account holder",
  )
    ? VIDEO_DURATION_MESSAGE
    : message;
}

export function readVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    let video: HTMLVideoElement | undefined;
    let url: string | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const finish = (duration: number | null) => {
      clearTimeout(timeout);
      if (video) {
        video.onloadedmetadata = null;
        video.onerror = null;
        video.removeAttribute("src");
        video.load();
      }
      if (url) URL.revokeObjectURL(url);
      resolve(duration);
    };

    try {
      const element = document.createElement("video");
      video = element;
      video.preload = "metadata";
      url = URL.createObjectURL(file);
      video.onloadedmetadata = () => {
        const duration = element.duration;
        finish(Number.isFinite(duration) && duration >= 0 ? duration : null);
      };
      video.onerror = () => finish(null);
      timeout = setTimeout(() => finish(null), 5000);
      video.src = url;
    } catch {
      finish(null);
    }
  });
}
