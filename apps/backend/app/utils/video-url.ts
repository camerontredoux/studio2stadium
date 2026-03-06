import env from "#start/env";

export function videoUrl(
  key: string | null | undefined,
  type: "youtube" | "cloudflare"
) {
  if (type === "youtube") {
    return `https://www.youtube.com/embed/${key}`;
  }

  return `${env.get("CLOUDFLARE_STREAM_URL")}/${key}/iframe`;
}

export function videoThumbnailUrl(
  key: string | null | undefined,
  type: "youtube" | "cloudflare"
) {
  if (!key) return null;

  if (type === "youtube") {
    return `https://img.youtube.com/vi/${key}/hqdefault.jpg`;
  }

  return `${env.get("CLOUDFLARE_STREAM_URL")}/${key}/thumbnails/thumbnail.jpg`;
}
