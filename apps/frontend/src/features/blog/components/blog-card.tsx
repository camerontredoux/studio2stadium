import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ContentCard } from "@/components/shared/content-card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatDate } from "@/components/utils/format";
import type { ApiSchemas } from "@/lib/api/client";
import { CalendarIcon, TrashIcon } from "lucide-react";
import { useState } from "react";

type Blog = ApiSchemas["BlogResponse"][number];

interface BlogCardProps {
  blog: Blog;
  onDelete?: (id: string, onSettled: () => void) => void;
  isDeleting?: boolean;
}

export function BlogCard({ blog, onDelete, isDeleting }: BlogCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDelete = () => {
    onDelete?.(blog.id, () => setDialogOpen(false));
  };

  return (
    <ContentCard
      image={blog.thumbnail}
      imageAlt={blog.title}
      title={blog.title}
      footer={
        <div className="flex w-full items-center justify-between">
          <Button
            size="xs"
            render={
              <a
                href={`https://marketing.studio2stadium.com/blog/${blog.slug}`}
                target="_blank"
              />
            }
          >
            Read More
          </Button>
          {onDelete && (
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <AlertDialogTrigger
                render={<Button size="icon-xs" variant="ghost" />}
              >
                <TrashIcon className="text-destructive-foreground size-4" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{blog.title}"? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogClose
                    render={<Button variant="secondary" />}
                    disabled={isDeleting}
                  >
                    Cancel
                  </AlertDialogClose>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? <Spinner label="Deleting..." /> : "Delete"}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      }
    >
      <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <CalendarIcon className="text-brand size-3.5 shrink-0" />
        <span>{formatDate(blog.createdAt)}</span>
      </div>
      <p className="text-muted-foreground line-clamp-3 text-sm">
        {blog.description}
      </p>
    </ContentCard>
  );
}
