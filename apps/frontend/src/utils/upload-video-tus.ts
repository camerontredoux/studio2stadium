import * as tus from "tus-js-client";
import { videoUploadErrorMessage } from "./video-duration";

interface TusUploadOptions {
  file: File;
  onProgress: (percent: number) => void;
  onSuccess: (mediaId: string) => void;
  onError: (error: Error) => void;
  endpoint?: string;
}

function extractTusErrorMessage(error: Error | tus.DetailedError): string {
  if ("originalResponse" in error && error.originalResponse) {
    try {
      const body = error.originalResponse.getBody();
      const parsed = JSON.parse(body);
      if (parsed.message) return parsed.message;
      if (parsed.error) return parsed.error;
    } catch {
      // Response wasn't JSON, fall through to default
    }
  }
  return error.message;
}

const TUS_CHUNK_SIZE = 10 * 1024 * 1024;

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
  endpoint,
}: TusUploadOptions): tus.Upload {
  // Our endpoint returns the Stream id on the creation response, which the
  // caller needs to follow processing.
  let mediaId = "";

  const upload = new tus.Upload(file, {
    onAfterResponse: (_request, response) => {
      mediaId ||= response.getHeader("stream-media-id") ?? "";
    },
    onBeforeRequest: (request) => {
      const xhr = request.getUnderlyingObject();
      if (request.getURL().includes(import.meta.env.VITE_API_URL)) {
        xhr.withCredentials = true;
      }
    },
    endpoint: endpoint ?? getTusEndpoint(),
    // Without a chunk size the whole file goes up in one PATCH, which mobile
    // browsers drop on a network blip with no response, and a retry restarts
    // from byte 0. Cloudflare needs chunks of at least 5 MiB in multiples of
    // 256 KiB, and caps a chunk at 200 MiB.
    chunkSize: TUS_CHUNK_SIZE,
    // Long enough to ride out a phone switching networks.
    retryDelays: [0, 1000, 3000, 5000, 10000, 20000, 30000],
    metadata: {
      filename: file.name,
      filetype: file.type,
    },
    onError: (error) => {
      const message = extractTusErrorMessage(
        error instanceof Error ? error : new Error(String(error)),
      );
      onError(new Error(videoUploadErrorMessage(message)));
    },
    onProgress: (bytesUploaded, bytesTotal) => {
      const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
      onProgress(percentage);
    },
    onSuccess: () => {
      onSuccess(mediaId);
    },
  });

  return upload;
}
