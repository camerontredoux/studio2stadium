import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";

import { cn } from "@/components/utils/cn";

type LabelProps = useRender.ComponentProps<"span">;

/**
 * The 11px mono `label` style in fg-3 that heads panels, tiles and
 * columns. Write the text in sentence case; it shows as written. Renders a
 * span unless `render` is given (e.g. `render={<h2 />}`).
 */
function Label({ className, render, ...props }: LabelProps) {
  return useRender({
    defaultTagName: "span",
    render,
    props: mergeProps<"span">(
      { className: cn("type-label text-fg-3", className) },
      props,
    ),
  });
}

export { Label };
export type { LabelProps };
