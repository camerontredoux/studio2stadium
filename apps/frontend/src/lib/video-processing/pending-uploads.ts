// Kept in localStorage so a reload while a video is processing still shows
// the indicator and the result.
export const STORAGE_KEY = "s2s.pendingVideoUploads";

export function readPendingUploads(): string[] {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

type UploadOutcome = "ready" | "failed" | "gone" | "processing";

// `null` means the server no longer has the upload for this user.
export function uploadOutcome(
  upload: { status: string } | null,
): UploadOutcome {
  if (!upload) return "gone";
  if (upload.status === "ready" || upload.status === "failed") {
    return upload.status;
  }
  return "processing";
}
