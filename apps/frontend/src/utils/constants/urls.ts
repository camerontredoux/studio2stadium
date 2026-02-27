export const CLOUDFLARE_IMAGE_URL = import.meta.env
  .VITE_CLOUDFLARE_IMAGE_DELIVERY_URL;

export function imageUrl(
  key: string | null | undefined,
  // opts: { width?: number; height?: number; quality?: number } = {},
) {
  if (!key) return undefined;

  // const transforms = [
  //   opts.width && `width=${opts.width}`,
  //   opts.height && `height=${opts.height}`,
  //   `quality=${opts.quality || 80}`,
  //   "fit=cover",
  //   "format=auto",
  // ]
  //   .filter(Boolean)
  //   .join(",");

  return `https://studio2stadium.com/cdn-cgi/image/width=320,height=320,quality=80,format=auto/https://images.studio2stadium.com/${key}`;
}
