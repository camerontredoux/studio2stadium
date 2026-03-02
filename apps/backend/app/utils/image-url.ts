export function imageUrl(
  key: string | null | undefined,
  type: "avatar" | "feed" | "thumbnail"
) {
  if (!key) return null;

  return `https://studio2stadium.com/img/${key}?type=${type}`;
}
