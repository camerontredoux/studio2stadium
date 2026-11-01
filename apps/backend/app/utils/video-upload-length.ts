// Matches the limit the upload form shows. Cloudflare takes Upload-Length as
// sent, so without this a crafted request could start any size of upload.
export const MAX_VIDEO_UPLOAD_BYTES = 500 * 1024 * 1024;

export function isValidUploadLength(uploadLength: string) {
  if (!/^\d+$/.test(uploadLength)) return false;
  const bytes = Number(uploadLength);
  return bytes >= 1 && bytes <= MAX_VIDEO_UPLOAD_BYTES;
}
