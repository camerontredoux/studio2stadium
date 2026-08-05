# Blog PDF attachments — integration for the public blog site

Admins can attach up to **5 PDFs** (≤10 MB each, ≤25 MB total) to a blog post
in the admin app. The public blog site (the separate Cloudflare-deployed repo)
is responsible for rendering the download links on each post page.

## Data

Each post row now has an `attachments` column: an array (or `null`) of:

```jsonc
{
  "id": "uuid",              // stable id — address downloads by this
  "name": "Event Packet.pdf",// original filename (display + download filename)
  "size": 1048576,           // bytes (verified server-side)
  "contentType": "application/pdf",
  "uploadedAt": "2026-08-04T..." // ISO timestamp
  // NOTE: the private R2 object key is intentionally NOT exposed
}
```

If you read posts from the API (`GET /blog`), the field is included with the
same shape (minus the key). If you read the DB directly at build time, select
`posts.attachments`.

## Rendering the download link

Point each attachment at the public, unauthenticated download endpoint:

```
GET https://<api-host>/blog/posts/{postId}/attachments/{attachmentId}
```

Example:

```html
{#each post.attachments ?? [] as file}
  <a href="https://api.studio2stadium.com/blog/posts/{post.id}/attachments/{file.id}">
    {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
  </a>
{/each}
```

The endpoint streams the PDF with `Content-Disposition: attachment` and the
original filename, so the browser downloads it directly — no need to build or
expose any storage URL yourself. Returns `404` if the post/attachment no longer
exists.

## Notes

- The R2 object key is resolved server-side from `{postId, attachmentId}`; this
  keeps storage details private and lets us add permissions/analytics/signed
  URLs later without changing the public contract.
- Deleting a post removes its PDFs from storage. Files uploaded but never
  attached are reclaimed by the `sweep:blog-orphans` command (run periodically).
