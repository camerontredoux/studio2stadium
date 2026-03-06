import { toastManager } from "@/components/ui/toast-manager";
import { useSession } from "@/lib/session";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDeleteBlog } from "../api/mutations";
import { blogQueries } from "../api/queries";
import { BlogCard } from "./blog-card";

export function BlogList() {
  const session = useSession();
  const { data } = useSuspenseQuery(blogQueries.all());
  const { mutate: deleteBlog, isPending } = useDeleteBlog();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (id: string, onSettled: () => void) => {
    setDeletingId(id);
    deleteBlog(
      { params: { path: { id } } },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: "Blog post deleted",
            type: "success",
          });
        },
        onError: () => {
          toastManager.add({
            title: "Error",
            description: "Failed to delete blog post",
            type: "error",
          });
        },
        onSettled: () => {
          setDeletingId(null);
          onSettled();
        },
      },
    );
  };

  return (
    <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3 lg:pt-4">
      {data.map((blog) => (
        <BlogCard
          key={blog.id}
          blog={blog}
          onDelete={session.role === "admin" ? handleDelete : undefined}
          isDeleting={isPending && deletingId === blog.id}
        />
      ))}
    </div>
  );
}
