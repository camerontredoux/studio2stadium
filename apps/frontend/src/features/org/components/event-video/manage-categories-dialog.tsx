import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { Button } from "@/components/event/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/event/dialog";
import { Icon } from "@/components/event/icon";
import { Input } from "@/components/ui/input";
import { BusyLabel } from "@/features/org/live/shared/busy-label";
import type { VideoCategory } from "@/features/org/api/video-queries";
import {
  useCreateCategory,
  useDeleteCategory,
} from "@/features/org/api/video-queries";
import { ConfirmDialog } from "@/features/org/live/shared/confirm-dialog";
import { inputControl } from "@/features/org/live/shared/sheet-field";

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
  const [deletingCategory, setDeletingCategory] =
    useState<VideoCategory | null>(null);
  const createCategory = useCreateCategory(slug, eventId);
  const deleteCategory = useDeleteCategory(slug, eventId);

  function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    createCategory.mutate(
      { params: { path: { slug, id: eventId } }, body: { name: trimmed } },
      { onSuccess: () => setNewName("") },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Manage categories</DialogTitle>
          <DialogDescription>
            Add or remove video categories for this event.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {categories.length === 0 ? (
            <p className="type-body text-fg-3 m-0 py-(--space-8) text-center">
              No categories yet. Add one below.
            </p>
          ) : (
            <ul className="border-line m-0 flex list-none flex-col rounded-(--radius-8) border p-0">
              {categories.map((cat) => {
                const count = videoCounts[cat.id] ?? 0;
                const hasVideos = count > 0;
                return (
                  <li
                    key={cat.id}
                    className="border-line-soft flex min-h-10 items-center gap-(--space-10) border-b py-(--space-4) ps-(--space-12) pe-(--space-6) last:border-b-0"
                  >
                    <span className="type-body text-fg min-w-0 flex-1 truncate">
                      {cat.name}
                    </span>
                    {hasVideos && (
                      <span className="type-meta text-fg-3 shrink-0">
                        {count} {count === 1 ? "video" : "videos"}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      label={
                        hasVideos
                          ? `Remove the videos in ${cat.name} first`
                          : `Delete ${cat.name}`
                      }
                      disabled={hasVideos || deleteCategory.isPending}
                      onClick={() => setDeletingCategory(cat)}
                      title={
                        hasVideos ? "Remove videos first" : "Delete category"
                      }
                      className="hover:text-danger"
                    >
                      <Icon icon={TrashIcon} />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}

          <form
            className="flex gap-(--space-8)"
            onSubmit={(e) => {
              e.preventDefault();
              handleAdd();
            }}
          >
            <Input
              aria-label="New category name"
              placeholder="New category name"
              value={newName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewName(e.target.value)
              }
              className={inputControl}
            />
            <Button
              type="submit"
              size="lg"
              disabled={!newName.trim() || createCategory.isPending}
            >
              {createCategory.isPending ? (
                <BusyLabel label="Adding…" />
              ) : (
                <>
                  <Icon icon={PlusIcon} />
                  Add
                </>
              )}
            </Button>
          </form>
        </DialogBody>

        <DialogFooter>
          <DialogClose render={<Button variant="primary" size="lg" />}>
            Done
          </DialogClose>
        </DialogFooter>

        <ConfirmDialog
          open={!!deletingCategory}
          onOpenChange={(next) => {
            if (!next) setDeletingCategory(null);
          }}
          title="Delete category?"
          description={
            <>
              Delete &ldquo;{deletingCategory?.name}&rdquo;? This can&rsquo;t be
              undone.
            </>
          }
          confirmLabel={deleteCategory.isPending ? "Deleting…" : "Delete"}
          pending={deleteCategory.isPending}
          onConfirm={() => {
            if (!deletingCategory) return;
            deleteCategory.mutate(
              {
                params: {
                  path: {
                    slug,
                    id: eventId,
                    categoryId: deletingCategory.id,
                  },
                },
              },
              { onSuccess: () => setDeletingCategory(null) },
            );
          }}
        />
      </DialogPopup>
    </Dialog>
  );
}
