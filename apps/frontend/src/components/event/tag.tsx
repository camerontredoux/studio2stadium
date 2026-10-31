import type * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/utils/cn";

type TagTone = "default" | "live" | "danger" | "muted";

type TagProps = Omit<React.ComponentProps<typeof Badge>, "variant" | "size"> & {
  /** `live` colours the word with `accent`, `danger` marks a blocking state, `muted` a past or inactive one. */
  tone?: TagTone;
};

const tones: Record<TagTone, string> = {
  default: "text-fg",
  live: "text-event-accent",
  danger: "text-danger",
  muted: "text-fg-3",
};

// Overrides every components/ui/badge class the S2S look changes, so tailwind-merge drops the originals.
// Sentence case, never uppercased: the user's rule for every status word.
const tag =
  "font-mono text-[11px] leading-[1.4] tabular-nums " +
  "h-[22px] min-w-0 flex-none gap-[5px] rounded-(--radius-4) border-line-control bg-transparent dark:bg-transparent px-[7px] font-normal " +
  "[&_svg:not([class*='size-'])]:size-[11px] sm:[&_svg:not([class*='size-'])]:size-[11px] [&_svg:not([class*='opacity-'])]:opacity-100";

/**
 * A bordered mono status word in sentence case: "Live", "Released", "Expired".
 * It is shown as written, never uppercased. The border stays `line-control` in
 * every tone.
 */
function Tag({ tone = "default", className, ...props }: TagProps) {
  return (
    <Badge
      variant="outline"
      className={cn(tag, tones[tone], className)}
      {...props}
    />
  );
}

export { Tag };
export type { TagProps, TagTone };
