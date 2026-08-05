import { z } from "zod";

/**
 * Client-side mirror of the server's blog attachment limits. The server
 * re-verifies everything from R2 metadata, so these exist only for fast,
 * friendly feedback in the form.
 */
export const BLOG_ATTACHMENT_LIMITS = {
  contentType: "application/pdf",
  maxFiles: 5,
  maxFileSize: 10 * 1024 * 1024,
  maxTotalSize: 25 * 1024 * 1024,
} as const;

export const blogAttachmentSchema = z.object({
  name: z.string().min(1),
  key: z.string().min(1),
  size: z.number().positive(),
});

export type BlogAttachment = z.infer<typeof blogAttachmentSchema>;

export const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  thumbnail: z.string().min(1, "Thumbnail is required"),
  content: z.string().min(1, "Content is required"),
  tags: z.array(z.string()).optional(),
  attachments: z
    .array(blogAttachmentSchema)
    .max(BLOG_ATTACHMENT_LIMITS.maxFiles, "At most 5 PDFs per post")
    .optional(),
});

export type BlogPostFormData = z.infer<typeof blogPostSchema>;
