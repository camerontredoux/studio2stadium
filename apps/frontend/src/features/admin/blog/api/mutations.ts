import { $api } from "@/lib/api/client";

export function useCreateBlogPost() {
  return $api.useMutation("post", "/admin/blog");
}
