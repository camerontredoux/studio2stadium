export function imageUrl(
  key: string | null | undefined,
  opts: { fit?: string; width?: number; height?: number; quality?: number } = {}
) {
  if (!key) return null;

  const transforms = [
    opts.width && `width=${opts.width}`,
    opts.height && `height=${opts.height}`,
    `quality=${opts.quality || 80}`,
    `fit=${opts.fit}`,
    "format=auto",
  ]
    .filter(Boolean)
    .join(",");

  return `https://studio2stadium.com/cdn-cgi/image/${transforms}/https://userdata.studio2stadium.com/${key}`;
}
