import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { VideoCategory } from "@/features/org/api/video-queries";
import {
  useCreateCategory,
  useDeleteCategory,
} from "@/features/org/api/video-queries";
import { Trash2Icon } from "lucide-react";
import { useState } from "react";

interface ManageCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: VideoCategory[];
  videoCounts: Record<string, number>;
  slug: string;
  eventId: string;
}

export function ManageCategoriesDialog({
  open,
  onOpenChange,
  categories,
  videoCounts,
  slug,
  eventId,
}: ManageCategoriesDialogProps) {
  const [newName, setNewName] = useState("");
  const createCategory = useCreateCategory(slug, eventId);
  const deleteCategory = useDeleteCategory(slug, eventId);

  function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    createCategory.mutate(
      { name: trimmed },
      { onSuccess: () => setNewName("") },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>
            Add or remove video categories for this event.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 px-6 py-2">
          {categories.length === 0 && (
            <p className="text-muted-foreground text-center text-sm py-4">
              No categories yet. Add one below.
            </p>
          )}

          {categories.map((cat) => {
            const count = videoCounts[cat.id] ?? 0;
            const hasVideos = count > 0;
            return (
              <div
                key={cat.id}
                className="border-border flex items-center gap-3 rounded-md border px-3 py-2"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {cat.name}
                </span>
                {hasVideos && (
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {count} {count === 1 ? "video" : "videos"}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={hasVideos || deleteCategory.isPending}
                  onClick={() => deleteCategory.mutate(cat.id)}
                  title={hasVideos ? "Remove videos first" : "Delete category"}
                >
                  {deleteCategory.isPending ? (
                    <Spinner className="size-3" />
                  ) : (
                    <Trash2Icon className="size-3" />
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 px-6">
          <Input
            placeholder="New category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!newName.trim() || createCategory.isPending}
          >
            {createCategory.isPending ? <Spinner className="size-3" /> : "Add"}
          </Button>
        </div>

        <DialogFooter variant="bare">
          <DialogClose render={<Button variant="outline" size="sm" />}>
            Done
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
