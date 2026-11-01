import type { Icon as PhosphorIcon, IconProps } from "@phosphor-icons/react";

import { cn } from "@/components/utils/cn";

const sizes = { sm: 14, md: 16, lg: 20, xl: 32 } as const;

type IconSize = keyof typeof sizes | number;

type EventIconProps = Omit<IconProps, "size"> & {
  /** A Phosphor icon component, e.g. `CheckIcon`. Regular weight. */
  icon: PhosphorIcon;
  /** `sm` 14px (buttons, chips, menus, rows; default), `md` 16px (nav, strips), `lg` 20px (dock), `xl` 32px (state icons), or a number. */
  size?: IconSize;
  /** Accessible name when the icon alone carries meaning; otherwise it is hidden from assistive tech. */
  label?: string;
};

/** A Phosphor icon at a design-system size. Decorative unless `label` is given. */
function Icon({
  icon: Glyph,
  size = "sm",
  label,
  className,
  ...props
}: EventIconProps) {
  const px = typeof size === "number" ? size : sizes[size];
  return (
    <Glyph
      size={px}
      weight="regular"
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}

export { Icon };
export type { EventIconProps as IconProps, IconSize };
