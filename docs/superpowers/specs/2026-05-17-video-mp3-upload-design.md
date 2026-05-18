# Video Library MP3 Upload

Add optional MP3 file upload alongside each video entry so dancers get the counts video + music in one place.

## Requirements

- Optional MP3 per video (not required to save a video)
- Storage: Cloudflare R2, existing bucket, `event-audio/` path prefix
- Max file size: 20 MB
- Upload method: presigned URL (browser uploads directly to R2)
- Dancer UX: inline HTML5 audio player + download button on video card

## Database Changes

Add two nullable columns to `event_videos` table:

| Column | Type | Notes |
|--------|------|-------|
| `audioKey` | `VARCHAR(500)` | R2 object key, e.g. `event-audio/{eventId}/{uuid}.mp3` |
| `audioFilename` | `VARCHAR(300)` | Original filename for display/download |

Migration required via `pnpm db:generate` + `pnpm db:migrate`.

## Backend API

### New Endpoint: Presigned Audio Upload URL

```
POST /orgs/{slug}/events/{eventId}/videos/audio-upload-url
```

- **Auth**: Admin only (existing org admin guard)
- **Request body**:
  - `contentType`: must be `audio/mpeg` or `audio/mp3`
  - `filename`: original filename, must end in `.mp3`
- **Validation**: content type whitelist, `.mp3` extension
- **Response**: `{ key: string, url: string }`
- **Implementation**: `drive.use("r2").getSignedUploadUrl(key, { expiresIn: "15 mins", contentType })` — same pattern as `upload-image/service.ts`
- **Key format**: `event-audio/{eventId}/{uuid}.mp3`

### Modified Endpoints: Create & Update Video

```
POST  /orgs/{slug}/events/{eventId}/videos
PATCH /orgs/{slug}/events/{eventId}/videos/{videoId}
```

Add optional fields to request body:

- `audioKey`: `string | null` — R2 object key. Pass `null` to remove audio. Omit to leave unchanged (update only).
- `audioFilename`: `string | null` — original filename. Pass `null` to remove. Omit to leave unchanged (update only).

Validator changes: add `audioKey` and `audioFilename` as optional, nullable vine strings.

Service changes: include `audioKey` and `audioFilename` in insert/update operations.

### Modified Response: Video List

```
GET /orgs/{slug}/events/{eventId}/videos
```

Each video object gains:

- `audioFilename`: `string | null` — original filename
- `audioUrl`: `string | null` — presigned GET URL (1-hour TTL), generated server-side when `audioKey` is present

Generation: iterate videos with `audioKey`, call `drive.use("r2").getSignedUrl(key, { expiresIn: "1 hr" })` for each.

### No Orphan Cleanup

When audio is replaced or a video deleted, the old R2 object is left in place. Storage costs are negligible for MP3s. Cleanup can be added later if needed.

## Frontend: Admin Form (AddEditVideoDialog)

### New Field: Audio File

Placed below the YouTube URL field. Optional.

**States:**

1. **Empty**: Drop zone / button labeled "Add music track (MP3, max 20MB)". Accepts `.mp3` only via `accept="audio/mpeg,.mp3"`.
2. **File selected**: Shows `{filename} · {size}` with an X button to clear.
3. **Uploading**: Progress bar replaces file info. Save button disabled during upload.
4. **Existing audio (edit mode)**: Shows filename with X to remove. Admin can replace by selecting a new file.

### Submit Flow

1. If new MP3 file selected → `POST .../audio-upload-url` to get presigned URL → `PUT` file to R2 directly from browser → capture returned `key` as `audioKey`
2. If existing audio removed → set `audioKey: null, audioFilename: null`
3. If no change to audio → omit audio fields from request
4. Create/update video with `audioKey` + `audioFilename` alongside existing fields
5. If R2 upload fails → toast error, don't save the video

### Upload Progress

Use `XMLHttpRequest` or `fetch` with progress events to track upload percentage during the direct-to-R2 PUT.

## Frontend: Dancer Video Card (EventVideoCard)

### Audio Strip

When `audioUrl` is present on a video, render below the video title:

- **`<audio>` element** with `controls` attribute — native browser player with play/pause, scrubber, time
- **Download button** — icon button that triggers download with `audioFilename` as the filename
- **No audio** — no change to existing card layout

### Placement

Audio strip appears on the card in the category grid view only. The video playback modal remains YouTube-only — music is a companion resource, not part of video playback.

## Frontend: Type & Query Changes (video-queries.ts)

- `EventVideo` type gains: `audioKey?: string | null`, `audioFilename?: string | null`, `audioUrl?: string | null`
- New mutation: `useAudioUploadUrl(orgSlug, eventId)` — calls the presigned URL endpoint
- Existing `useCreateVideo` / `useUpdateVideo` already pass through the request body; just include the new optional fields

## Files to Change

### Backend

- `app/database/schema/org-events.ts` — add `audioKey`, `audioFilename` columns to `event_videos`
- `app/modules/orgs/events/routes.ts` — add audio upload URL route
- New: `app/modules/orgs/events/videos/audio-upload-url/controller.ts` — handler
- New: `app/modules/orgs/events/videos/audio-upload-url/service.ts` — presigned URL generation
- New: `app/modules/orgs/events/videos/audio-upload-url/validator.ts` — input validation
- `app/modules/orgs/events/videos/create/validator.ts` — add optional audioKey, audioFilename
- `app/modules/orgs/events/videos/create/service.ts` — include audio fields in insert
- `app/modules/orgs/events/videos/update/validator.ts` — add optional audioKey, audioFilename
- `app/modules/orgs/events/videos/update/service.ts` — include audio fields in update
- `app/modules/orgs/events/videos/list/service.ts` — generate presigned GET URLs for videos with audioKey

### Frontend

- `src/features/org/api/video-queries.ts` — update types, add audio upload mutation
- `src/features/org/components/event-video/add-edit-video-dialog.tsx` — audio file picker, upload flow
- `src/features/org/components/event-video/event-video-card.tsx` — audio strip with player + download
- `src/routes/_org/o/$orgSlug/_authenticated/admin/video-library.tsx` — no structural changes needed (dialog handles it)
- `src/routes/_org/o/$orgSlug/_authenticated/dancer/video-library.tsx` — no structural changes needed (card handles it)

### Infrastructure

- Generate + run DB migration after schema change
- Regenerate frontend API types (`pnpm types`) after backend OpenAPI spec updates
