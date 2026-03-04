import * as tus from "tus-js-client";

interface TusUploadOptions {
  file: File;
  onProgress: (percent: number) => void;
  onSuccess: () => void;
  onError: (error: Error) => void;
}

// Use proxy in development to avoid cross-origin cookie issues
const getTusEndpoint = () => {
  if (import.meta.env.DEV) {
    return "/api/videos/tus";
  }
  return `${import.meta.env.VITE_API_URL}/videos/tus`;
};

export function uploadVideoTus({
  file,
  onProgress,
  onSuccess,
  onError,
}: TusUploadOptions): tus.Upload {
  const upload = new tus.Upload(file, {
    onBeforeRequest: (request) => {
      const xhr = request.getUnderlyingObject();
      xhr.withCredentials = true;
    },
    endpoint: getTusEndpoint(),
    retryDelays: [0, 1000, 3000, 5000],
    metadata: {
      filename: file.name,
      filetype: file.type,
    },
    onError: (error) => {
      onError(error instanceof Error ? error : new Error(String(error)));
    },
    onProgress: (bytesUploaded, bytesTotal) => {
      const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
      onProgress(percentage);
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  return upload;
}
