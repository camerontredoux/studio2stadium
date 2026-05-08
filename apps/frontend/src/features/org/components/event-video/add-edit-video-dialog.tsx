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
import { useMemo, useState, useEffect } from "react";
import type {
  EventVideo,
  VideoCategory,
} from "@/features/org/api/video-queries";
import {
  useCreateVideo,
  useUpdateVideo,
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
  const isPending = createVideo.isPending || updateVideo.isPending;

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && editingVideo) {
      setTitle(editingVideo.title);
      setCategoryId(editingVideo.categoryId);
      setYoutubeUrl(
        `https://www.youtube.com/watch?v=${editingVideo.youtubeId}`,
      );
      setErrors({});
    } else if (open) {
      setTitle("");
      setCategoryId("");
      setYoutubeUrl("");
      setErrors({});
    }
  }, [open, editingVideo]);

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

  function handleSubmit() {
    if (!validate() || !youtubeId) return;

    const body = { title: title.trim(), categoryId, youtubeId };

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
