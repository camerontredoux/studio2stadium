import env from "#start/env";

// Prod's `images` Worker resizes from prod's bucket. Staging sets
// IMAGE_BASE_URL to its own bucket's public URL, where `type` is ignored.
const DEFAULT_IMAGE_BASE_URL = "https://studio2stadium.com/img";

export function imageUrl(
  key: string | null | undefined,
  type: "avatar" | "feed" | "thumbnail"
) {
  if (!key) return null;

  const base = env.get("IMAGE_BASE_URL") ?? DEFAULT_IMAGE_BASE_URL;
  return `${base}/${key}?type=${type}`;
}
