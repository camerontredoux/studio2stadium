import {
  Textarea as UiTextarea,
  type TextareaProps as UiTextareaProps,
} from "@/components/ui/textarea";
import { cn } from "@/components/utils/cn";

type TextareaProps = Omit<UiTextareaProps, "size" | "unstyled">;

// The border sits on components/ui's wrapping span, so the textarea's own padding and
// min-height are 1px smaller than the design's border-box values (8px 10px, 64px).
const control =
  "max-w-[640px] rounded-(--radius-6) border-line-control bg-bg-300 dark:bg-bg-300 text-fg shadow-none before:hidden transition-[border-color] " +
  "has-focus-visible:border-line-focus has-focus-visible:ring-0 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-fg has-disabled:opacity-35 " +
  "[&_textarea]:min-h-[62px] [&_textarea]:resize-y [&_textarea]:[field-sizing:fixed] [&_textarea]:px-[9px] [&_textarea]:py-[7px] [&_textarea]:leading-[1.45] " +
  "[&_textarea]:s2s-input-size [&_textarea]:desk:text-[13px] [&_textarea]:placeholder:text-fg-3";

/** A multi-line note field inset on `bg-300`, at most 640px wide, resizable vertically. Give it an `aria-label`. */
function Textarea({ className, ...props }: TextareaProps) {
  return <UiTextarea className={cn(control, className)} {...props} />;
}

export { Textarea };
export type { TextareaProps };
