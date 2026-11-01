import { MusicNotesIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/event/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/event/dialog";
import { Icon } from "@/components/event/icon";
import { Select } from "@/components/event/select";
import { BusyLabel } from "@/features/org/live/shared/busy-label";
import type {
  EventVideo,
  VideoCategory,
} from "@/features/org/api/video-queries";
import {
  useAudioUploadUrl,
  useCreateVideo,
  useUpdateVideo,
} from "@/features/org/api/video-queries";
import {
  SheetField,
  SheetFieldFrame,
} from "@/features/org/live/shared/sheet-field";
import type { ApiSchemas } from "@/lib/api/client";
import { getYouTubeId } from "@/utils/get-youtube-id";
import { uploadToCloudflare } from "@/utils/upload-to-cloudflare";

const FORM_ID = "event-video-form";

type AudioContentType =
  ApiSchemas["OrgsIdEventsIdVideosAudiouploadurlRequest"]["contentType"];

interface AddEditVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: VideoCategory[];
  slug: string;
  eventId: string;
  editingVideo?: EventVideo | null;
}

export function AddEditVideoDialog({
  open,
  onOpenChange,
  categories,
  slug,
  eventId,
  editingVideo,
}: AddEditVideoDialogProps) {
  const isEditing = !!editingVideo;
  const createVideo = useCreateVideo(slug, eventId);
  const updateVideo = useUpdateVideo(slug, eventId);

  const [prevOpen, setPrevOpen] = useState(open);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [existingAudioFilename, setExistingAudioFilename] = useState<
    string | null
  >(null);
  const [audioRemoved, setAudioRemoved] = useState(false);
  const [audioUploading, setAudioUploading] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioUploadUrl = useAudioUploadUrl();
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Reset the form each time the dialog opens.
  if (open !== prevOpen) {
    setPrevOpen(open);
  }
  if (open && !prevOpen) {
    if (editingVideo) {
      setTitle(editingVideo.title);
      setCategoryId(editingVideo.categoryId);
      setYoutubeUrl(
        `https://www.youtube.com/watch?v=${editingVideo.youtubeId}`,
      );
      setExistingAudioFilename(editingVideo.audioFilename ?? null);
    } else {
      setTitle("");
      setCategoryId("");
      setYoutubeUrl("");
      setExistingAudioFilename(null);
    }
    setErrors({});
    setAudioFile(null);
    setAudioRemoved(false);
    setAudioUploading(false);
    setAudioProgress(0);
  }

  const isPending =
    createVideo.isPending || updateVideo.isPending || audioUploading;

  const youtubeId = useMemo(() => getYouTubeId(youtubeUrl), [youtubeUrl]);

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Title is required";
    if (!categoryId) next.categoryId = "Category is required";
    if (!youtubeId) next.youtubeUrl = "Enter a valid YouTube URL";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleAudioSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, audio: "File must be under 20 MB" }));
      return;
    }
    setErrors((prev) => {
      const { audio: _, ...rest } = prev;
      return rest;
    });
    setAudioFile(file);
    setExistingAudioFilename(null);
    setAudioRemoved(false);
  }

  function clearAudio() {
    setAudioFile(null);
    setExistingAudioFilename(null);
    setAudioRemoved(true);
    if (audioInputRef.current) audioInputRef.current.value = "";
  }

  async function handleSubmit() {
    if (!validate() || !youtubeId) return;

    let audioKey: string | null | undefined;
    let audioFilename: string | null | undefined;

    if (audioFile) {
      setAudioUploading(true);
      setAudioProgress(0);
      try {
        const { key, url } = await audioUploadUrl.mutateAsync({
          params: { path: { slug, id: eventId } },
          body: {
            // The spec enum is the set the backend accepts. Any other file
            // type is sent as is and rejected, failing like an upload error.
            contentType: (audioFile.type || "audio/mpeg") as AudioContentType,
            filename: audioFile.name,
          },
        });
        await uploadToCloudflare(url, audioFile, setAudioProgress);
        audioKey = key;
        audioFilename = audioFile.name;
      } catch {
        setErrors((prev) => ({ ...prev, audio: "Audio upload failed" }));
        setAudioUploading(false);
        return;
      }
      setAudioUploading(false);
    } else if (audioRemoved) {
      audioKey = null;
      audioFilename = null;
    }

    const body = {
      title: title.trim(),
      categoryId,
      youtubeId,
      ...(audioKey !== undefined && { audioKey }),
      ...(audioFilename !== undefined && { audioFilename }),
    };

    if (isEditing && editingVideo) {
      updateVideo.mutate(
        {
          params: { path: { slug, id: eventId, videoId: editingVideo.id } },
          body,
        },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createVideo.mutate(
        { params: { path: { slug, id: eventId } }, body },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit video" : "Add video"}</DialogTitle>
        </DialogHeader>

        <form
          id={FORM_ID}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
          className="flex min-h-0 flex-col"
        >
          <DialogBody>
            <SheetField
              label="Title"
              autoComplete="off"
              value={title}
              onValueChange={setTitle}
              placeholder="e.g. Hip hop combo, week 1"
              error={errors.title}
            />

            <SheetFieldFrame label="Category" error={errors.categoryId}>
              <Select
                size="lg"
                options={categoryOptions}
                value={categoryId || null}
                onChange={(value) => setCategoryId(value ?? "")}
                placeholder="Select category"
                className={errors.categoryId ? "border-danger" : undefined}
              />
            </SheetFieldFrame>

            <SheetField
              label="YouTube URL"
              type="url"
              autoComplete="off"
              value={youtubeUrl}
              onValueChange={setYoutubeUrl}
              placeholder="https://www.youtube.com/watch?v=..."
              error={errors.youtubeUrl}
            />

            {youtubeId && (
              <div className="border-line bg-bg-000 aspect-video overflow-clip rounded-(--radius-8) border">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title="Video preview"
                  className="block h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            <SheetFieldFrame
              label="Music track (optional)"
              error={errors.audio}
            >
              {audioFile || (existingAudioFilename && !audioRemoved) ? (
                <div className="border-line-control bg-bg-300 flex h-(--control-lg) items-center gap-(--space-8) rounded-(--radius-6) border ps-[9px] pe-(--space-2)">
                  <Icon icon={MusicNotesIcon} className="text-fg-3" />
                  <span className="type-body text-fg min-w-0 flex-1 truncate">
                    {audioFile ? audioFile.name : existingAudioFilename}
                  </span>
                  {audioFile && (
                    <span className="type-meta text-fg-3 shrink-0">
                      {(audioFile.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    label="Remove music track"
                    onClick={clearAudio}
                    disabled={audioUploading}
                  >
                    <Icon icon={XIcon} />
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/mpeg,.mp3"
                    onChange={handleAudioSelect}
                    className="hidden"
                    id="audio-file-input"
                  />
                  <Button
                    size="lg"
                    onClick={() => audioInputRef.current?.click()}
                  >
                    <Icon icon={PlusIcon} />
                    Add music track (MP3, max 20 MB)
                  </Button>
                </div>
              )}
              {audioUploading && (
                <div
                  role="progressbar"
                  aria-label="Uploading music track"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(audioProgress)}
                  className="bg-surface-pressed h-1 w-full overflow-hidden rounded-full"
                >
                  <div
                    className="bg-fg h-full rounded-full transition-[width] duration-300"
                    style={{ width: `${audioProgress}%` }}
                  />
                </div>
              )}
            </SheetFieldFrame>
          </DialogBody>
        </form>

        <DialogFooter>
          <DialogClose render={<Button variant="ghost" size="lg" />}>
            Cancel
          </DialogClose>
          <Button
            type="submit"
            form={FORM_ID}
            variant="primary"
            size="lg"
            disabled={isPending}
          >
            {isPending ? (
              <BusyLabel label={isEditing ? "Saving…" : "Adding…"} />
            ) : isEditing ? (
              "Save changes"
            ) : (
              "Add video"
            )}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
