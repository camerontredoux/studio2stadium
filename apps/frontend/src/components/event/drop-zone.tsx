import { CloudArrowUpIcon } from "@phosphor-icons/react";
import type * as React from "react";

import { Button } from "@/components/event/button";
import { Icon } from "@/components/event/icon";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { cn } from "@/components/utils/cn";

type DropZoneProps = Omit<
  React.ComponentProps<typeof FileUpload>,
  | "value"
  | "defaultValue"
  | "onValueChange"
  | "onAccept"
  | "onUpload"
  | "maxFiles"
  | "children"
> & {
  /** Called with the files that passed `accept` and `maxSize` (one file unless `multiple`). */
  onFilesAccepted?: (files: File[]) => void;
  /** The instruction before the button. Default "Drop a file, or". */
  title?: React.ReactNode;
  /** The button label. Default "Browse". */
  buttonLabel?: React.ReactNode;
  /** The mono note under it. Default "Max N MB" from `maxSize`, else nothing. */
  note?: React.ReactNode;
};

function formatLimit(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return `Max ${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`;
}

/**
 * The dashed upload area that fills an empty tile. Drag and drop, paste, the
 * file picker and `accept`/`maxSize` checks come from components/ui/file-upload;
 * rejected files go to `onFileReject(file, message)`.
 */
function DropZone({
  onFilesAccepted,
  title = "Drop a file, or",
  buttonLabel = "Browse",
  note,
  maxSize,
  multiple = false,
  disabled = false,
  label,
  className,
  ...props
}: DropZoneProps) {
  const limit = note ?? (maxSize ? formatLimit(maxSize) : null);

  return (
    <FileUpload
      maxSize={maxSize}
      multiple={multiple}
      disabled={disabled}
      label={label ?? (typeof title === "string" ? title : undefined)}
      onAccept={(files) => {
        onFilesAccepted?.(multiple ? files : files.slice(0, 1));
      }}
      className={cn("min-h-0 flex-1 gap-0", className)}
      {...props}
    >
      <FileUploadDropzone
        tabIndex={-1}
        className={cn(
          "border-line-dashed flex-1 cursor-pointer gap-(--space-10) rounded-(--radius-8) border border-dashed p-(--space-12) text-center",
          "hover:border-line-hover transition-[border-color,background-color] duration-150 ease-[ease] hover:bg-transparent",
          "data-dragging:border-line-hover data-dragging:bg-surface-hover data-invalid:border-danger data-invalid:ring-0",
          "data-disabled:cursor-not-allowed data-disabled:opacity-35",
        )}
      >
        <Icon icon={CloudArrowUpIcon} size="lg" className="text-fg-2" />
        <span className="type-body text-fg-2 flex flex-wrap items-center justify-center gap-(--space-8)">
          {title}
          <FileUploadTrigger asChild>
            <Button>{buttonLabel}</Button>
          </FileUploadTrigger>
        </span>
        {limit && (
          <span className="text-fg-3 font-mono text-[11px] leading-[1.4]">
            {limit}
          </span>
        )}
      </FileUploadDropzone>
    </FileUpload>
  );
}

export { DropZone };
export type { DropZoneProps };
