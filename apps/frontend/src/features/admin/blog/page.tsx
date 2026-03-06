import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { useState } from "react";
import { useCreateBlogPost } from "./api/mutations";
import type { BlogPostFormData } from "./api/schemas";
import { BlogForm } from "./components/blog-form";

export function BlogPage() {
  const { mutate: createPost, isPending } = useCreateBlogPost();
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = (data: BlogPostFormData) => {
    createPost(
      {
        body: {
          title: data.title,
          description: data.description,
          thumbnail: data.thumbnail,
          content: data.content,
          tags: data.tags,
        },
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: "Blog post created",
            type: "success",
          });
          setFormKey((k) => k + 1);
        },
        onError: () => {
          toastManager.add({
            title: "Error",
            description: "Failed to create blog post",
            type: "error",
          });
        },
      },
    );
  };

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Create Blog Post</CardTitle>
        </CardHeader>
        <CardContent>
          <BlogForm key={formKey} onSubmit={handleSubmit} formId="blog-form" />
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" size="sm" form="blog-form" disabled={isPending}>
            {isPending ? <Spinner label="Publishing..." /> : "Publish Post"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
