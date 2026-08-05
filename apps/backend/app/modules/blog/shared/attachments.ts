/**
 * Shared rules for blog PDF attachments.
 *
 * Per-file limits (MIME + size) are also checked at presign time for fast UX
 * feedback, but the server treats R2 object metadata as the source of truth and
 * re-verifies everything here before an attachment is persisted to a post.
 *
 * TODO(edit-support): there is no update-blog-post flow yet, so an attachment
 * removed/replaced before the post is saved is cleaned up by the periodic
 * orphan sweep. When post editing is added, diff the old vs. new attachment
 * keys in that flow and `disk.delete()` the removed ones immediately rather
 * than waiting on the sweep.
 */
export const BLOG_ATTACHMENTS = {
  /** Object key prefix under which every blog attachment is stored in R2. */
  prefix: "blog/",
  /** Only PDFs are accepted as downloadable attachments today. */
  contentType: "application/pdf",
  /** Maximum number of attachments per post. */
  maxFiles: 5,
  /** Maximum size of a single attachment, in bytes (10 MB). */
  maxFileSize: 10 * 1024 * 1024,
  /** Maximum combined size of all attachments on a post, in bytes (25 MB). */
  maxTotalSize: 25 * 1024 * 1024,
} as const;

/**
 * Keys minted by the presign flow for blog PDFs look like
 * `blog/<uuid>.pdf`. Enforcing the exact shape prevents a caller from
 * attaching an arbitrary/foreign object (e.g. an avatar or another user's
 * upload) by submitting a hand-crafted key.
 */
export const BLOG_ATTACHMENT_KEY_RE =
  /^blog\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/i;

export function isValidBlogAttachmentKey(key: string): boolean {
  return BLOG_ATTACHMENT_KEY_RE.test(key);
}
