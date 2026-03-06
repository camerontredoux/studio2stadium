import { $api } from "@/lib/api/client";
import { blogQueries } from "./queries";

export function useDeleteBlog() {
  return $api.useMutation("delete", "/admin/blog/{id}", {
    meta: {
      invalidateQueries: [blogQueries.all().queryKey],
    },
  });
}
