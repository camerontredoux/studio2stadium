import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { blogPostSchema, type BlogPostFormData } from "../api/schemas";
import { RichTextEditor } from "./rich-text-editor";
import { ThumbnailUpload } from "@/shared/images/components/thumbnail-upload";

interface BlogFormProps {
  onSubmit: (data: BlogPostFormData) => void;
  formId: string;
}

export function BlogForm({ onSubmit, formId }: BlogFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: "",
      description: "",
      thumbnail: "",
      content: "",
      tags: [],
    },
  });

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field invalid={!!errors.title}>
          <FieldLabel>Title</FieldLabel>
          <Input {...register("title")} placeholder="Blog post title" />
          <FieldError error={errors.title} />
        </Field>

        <Field invalid={!!errors.description}>
          <FieldLabel>Description</FieldLabel>
          <Textarea
            {...register("description")}
            placeholder="Brief description for SEO and previews"
          />
          <FieldError error={errors.description} />
        </Field>

        <Field invalid={!!errors.thumbnail}>
          <FieldLabel>Thumbnail</FieldLabel>
          <Controller
            name="thumbnail"
            control={control}
            render={({ field }) => (
              <ThumbnailUpload value={field.value} onChange={field.onChange} />
            )}
          />
          <FieldError error={errors.thumbnail} />
        </Field>

        <Field invalid={!!errors.content}>
          <FieldLabel>Content</FieldLabel>
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                value={field.value}
                onChange={field.onChange}
                placeholder="Write your blog post content..."
              />
            )}
          />
          <FieldError error={errors.content} />
        </Field>

        <Field invalid={!!errors.tags}>
          <FieldLabel>Tags (comma-separated)</FieldLabel>
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <Input
                value={field.value?.join(", ") ?? ""}
                onChange={(e) => {
                  const tags = e.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean);
                  field.onChange(tags.length > 0 ? tags : undefined);
                }}
                placeholder="tech, sports, news"
              />
            )}
          />
          <FieldError error={errors?.tags?.[0]} />
        </Field>
      </FieldGroup>
    </form>
  );
}
