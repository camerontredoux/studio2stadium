import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { getYouTubeId } from "@/utils/get-youtube-id";
import { uploadToCloudflare } from "@/utils/upload-to-cloudflare";
import { useMemo, useRef, useState } from "react";
import { Music2Icon, XIcon } from "lucide-react";
import type {
  EventVideo,
  VideoCategory,
} from "@/features/org/api/video-queries";
import {
  useCreateVideo,
  useUpdateVideo,
  useAudioUploadUrl,
} from "@/features/org/api/video-queries";

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

  const prevOpenRef = useRef(open);
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
  const audioUploadUrl = useAudioUploadUrl(slug, eventId);
  const audioInputRef = useRef<HTMLInputElement>(null);

  if (open && !prevOpenRef.current) {
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
  prevOpenRef.current = open;

  const isPending =
    createVideo.isPending || updateVideo.isPending || audioUploading;

  const youtubeId = useMemo(() => getYouTubeId(youtubeUrl), [youtubeUrl]);

  const categoryItems = categories.map((c) => ({ value: c.id, label: c.name }));

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
          contentType: audioFile.type || "audio/mpeg",
          filename: audioFile.name,
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
        { videoId: editingVideo.id, ...body },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createVideo.mutate(body, { onSuccess: () => onOpenChange(false) });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Video" : "Add Video"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-6 py-2">
          <Field invalid={!!errors.title}>
            <FieldLabel>Title</FieldLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hip Hop Combo – Week 1"
            />
            <FieldError error={errors.title ? { type: "validate", message: errors.title } : undefined} />
          </Field>

          <Field invalid={!!errors.categoryId}>
            <FieldLabel>Category</FieldLabel>
            <Select
              items={categoryItems}
              value={categoryId || null}
              onValueChange={(value) => setCategoryId(value ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categoryItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError error={errors.categoryId ? { type: "validate", message: errors.categoryId } : undefined} />
          </Field>

          <Field invalid={!!errors.youtubeUrl}>
            <FieldLabel>YouTube URL</FieldLabel>
            <Input
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <FieldError error={errors.youtubeUrl ? { type: "validate", message: errors.youtubeUrl } : undefined} />
          </Field>

          {youtubeId && (
            <div className="overflow-clip rounded-xl border bg-black/5 dark:bg-white/5">
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title="Video preview"
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          <Field invalid={!!errors.audio}>
            <FieldLabel>Music Track (optional)</FieldLabel>
            {audioFile ? (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
                <Music2Icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">
                  {audioFile.name}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {(audioFile.size / (1024 * 1024)).toFixed(1)} MB
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={clearAudio}
                >
                  <XIcon className="size-3" />
                </Button>
              </div>
            ) : existingAudioFilename && !audioRemoved ? (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
                <Music2Icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">
                  {existingAudioFilename}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={clearAudio}
                >
                  <XIcon className="size-3" />
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
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => audioInputRef.current?.click()}
                >
                  <Music2Icon className="mr-1.5 size-3.5" />
                  Add music track (MP3, max 20 MB)
                </Button>
              </div>
            )}
            {audioUploading && (
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
            )}
            <FieldError
              error={
                errors.audio
                  ? { type: "validate", message: errors.audio }
                  : undefined
              }
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <Spinner label={isEditing ? "Saving..." : "Adding..."} />
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Add Video"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
