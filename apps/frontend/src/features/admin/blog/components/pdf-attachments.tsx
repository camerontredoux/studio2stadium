import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toastManager } from "@/components/ui/toast-manager";
import { useRequestUpload } from "@/shared/images/api/mutations";
import { uploadToCloudflare } from "@/utils/upload-to-cloudflare";
import { FileTextIcon, PlusIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";
import {
  BLOG_ATTACHMENT_LIMITS,
  type BlogAttachment,
} from "../api/schemas";

interface PdfAttachmentsProps {
  value: BlogAttachment[];
  onChange: (value: BlogAttachment[]) => void;
}

interface Uploading {
  name: string;
  progress: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PdfAttachments({ value, onChange }: PdfAttachmentsProps) {
  const { mutateAsync: requestUpload } = useRequestUpload();
  const [uploading, setUploading] = useState<Uploading | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const total = value.reduce((sum, a) => sum + a.size, 0);

  const notify = (description: string) =>
    toastManager.add({ title: "Can't add PDF", description, type: "error" });

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (inputRef.current) inputRef.current.value = "";
    if (files.length === 0) return;

    // Accumulate against a running copy so multi-select validates correctly.
    let current = [...value];

    for (const file of files) {
      if (file.type !== BLOG_ATTACHMENT_LIMITS.contentType) {
        notify(`"${file.name}" is not a PDF.`);
        continue;
      }
      if (file.size > BLOG_ATTACHMENT_LIMITS.maxFileSize) {
        notify(`"${file.name}" is larger than 10 MB.`);
        continue;
      }
      if (current.length >= BLOG_ATTACHMENT_LIMITS.maxFiles) {
        notify(`You can attach at most ${BLOG_ATTACHMENT_LIMITS.maxFiles} PDFs.`);
        break;
      }
      const runningTotal = current.reduce((sum, a) => sum + a.size, 0);
      if (runningTotal + file.size > BLOG_ATTACHMENT_LIMITS.maxTotalSize) {
        notify(`Adding "${file.name}" would exceed the 25 MB total limit.`);
        continue;
      }

      try {
        setUploading({ name: file.name, progress: 0 });
        const { key, url } = await requestUpload({
          body: {
            contentType: file.type,
            type: "blog",
            size: file.size,
          },
        });
        await uploadToCloudflare(url, file, (progress) =>
          setUploading({ name: file.name, progress }),
        );

        current = [...current, { name: file.name, key, size: file.size }];
        onChange(current);
      } catch {
        notify(`Failed to upload "${file.name}".`);
      } finally {
        setUploading(null);
      }
    }
  };

  const remove = (key: string) => {
    onChange(value.filter((a) => a.key !== key));
  };

  const atLimit = value.length >= BLOG_ATTACHMENT_LIMITS.maxFiles;

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <ul className="flex flex-col gap-2">
          {value.map((a) => (
            <li
              key={a.key}
              className="border-input flex items-center gap-3 rounded-lg border px-3 py-2"
            >
              <FileTextIcon className="text-muted-foreground size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-sm">{a.name}</span>
              <span className="text-muted-foreground text-xs">
                {formatBytes(a.size)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => remove(a.key)}
                aria-label={`Remove ${a.name}`}
              >
                <XIcon className="size-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {uploading && (
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground truncate text-xs">
            Uploading {uploading.name}…
          </span>
          <Progress value={uploading.progress} />
        </div>
      )}

      <div className="flex items-center gap-3">
        <label
          className="border-input hover:border-primary/50 hover:bg-primary/5 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 flex w-fit cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed px-3 py-2 text-sm transition-colors"
          data-disabled={atLimit || uploading !== null}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleFiles}
            className="hidden"
            disabled={atLimit || uploading !== null}
          />
          <PlusIcon className="size-4" />
          Add PDF
        </label>
        <span className="text-muted-foreground text-xs">
          {value.length}/{BLOG_ATTACHMENT_LIMITS.maxFiles} files ·{" "}
          {formatBytes(total)}/25 MB · 10 MB per file
        </span>
      </div>
    </div>
  );
}
