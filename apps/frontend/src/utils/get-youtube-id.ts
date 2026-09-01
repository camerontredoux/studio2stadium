const ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

const YOUTUBE_HOSTS = [
  "youtube.com",
  "youtube-nocookie.com",
  "youtu.be",
] as const;

// Paths that carry the video id as the segment right after the keyword, e.g.
// /shorts/<id>, /live/<id>, /embed/<id>.
const PATH_KEYWORDS = ["embed", "shorts", "live", "v", "e"];

function hostMatches(hostname: string) {
  const host = hostname.replace(/^www\./, "").toLowerCase();
  return YOUTUBE_HOSTS.some(
    (base) => host === base || host.endsWith(`.${base}`),
  );
}

/**
 * Pulls the 11-character video id out of any shape of YouTube link people
 * actually paste: watch URLs with the `v` param in any position, share links
 * (youtu.be), shorts, live, embed, mobile/music subdomains, or a bare id.
 */
export function getYouTubeId(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (ID_PATTERN.test(trimmed)) return trimmed;

  let parsed: URL;
  try {
    parsed = new URL(
      /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
    );
  } catch {
    return null;
  }

  if (!hostMatches(parsed.hostname)) return null;

  const v = parsed.searchParams.get("v");
  if (v && ID_PATTERN.test(v)) return v;

  const segments = parsed.pathname.split("/").filter(Boolean);

  // youtu.be/<id>
  if (parsed.hostname.replace(/^www\./, "").toLowerCase() === "youtu.be") {
    const [id] = segments;
    return id && ID_PATTERN.test(id) ? id : null;
  }

  for (let i = 0; i < segments.length - 1; i++) {
    if (PATH_KEYWORDS.includes(segments[i].toLowerCase())) {
      const id = segments[i + 1];
      if (ID_PATTERN.test(id)) return id;
    }
  }

  return null;
}
