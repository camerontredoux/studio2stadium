import { MagnifyingGlassIcon } from "@phosphor-icons/react";

import { Icon } from "@/components/event/icon";
import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/components/utils/cn";

type SearchProps = Omit<InputProps, "size" | "unstyled" | "type"> & {
  /** Names what it searches ("Search dancers"); also the accessible name unless `aria-label` is given. */
  placeholder: string;
  /** Classes for the outer wrapper (layout: width, margins). */
  className?: string;
};

// The border sits on components/ui's wrapping span, so the input is 26px tall and its
// padding is 1px smaller than the design's border-box values (0 8px 0 28px).
const control =
  "rounded-(--radius-6) border-line-control bg-bg-300 dark:bg-bg-300 text-fg shadow-none before:hidden transition-[border-color] " +
  "has-focus-visible:border-line-focus has-focus-visible:ring-0 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-fg has-disabled:opacity-35 " +
  "[&_input]:h-[26px] [&_input]:leading-[26px] [&_input]:ps-[27px] [&_input]:pe-[7px] [&_input]:s2s-input-size [&_input]:placeholder:text-fg-3";

/** The table toolbar's 28px search field with a magnifying glass. Sits at the right of the toolbar, up to 260px wide; full width on phones. */
function Search({
  placeholder,
  className,
  "aria-label": ariaLabel,
  ...props
}: SearchProps) {
  return (
    <div
      className={cn(
        "bp-phone:ms-0 bp-phone:flex-auto relative ms-auto flex min-w-0 flex-[0_1_260px] items-center",
        className,
      )}
    >
      <Input
        type="search"
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className={control}
        {...props}
      />
      <Icon
        icon={MagnifyingGlassIcon}
        className="text-fg-3 pointer-events-none absolute start-(--space-8)"
      />
    </div>
  );
}

export { Search };
export type { SearchProps };
