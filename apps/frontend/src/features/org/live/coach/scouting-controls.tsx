import {
  HeartIcon,
  MegaphoneSimpleIcon,
  NotePencilIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { forwardRef } from "react";

import {
  IconToggle,
  PillToggle,
  type PillToggleVariant,
} from "@/components/event/pill-toggle";
import { cn } from "@/components/utils/cn";

/** Phosphor's filled heart, for a favourited dancer (the mockup's `hf-on`). */
export const HeartFillIcon = forwardRef<
  SVGSVGElement,
  React.ComponentProps<typeof HeartIcon>
>(function HeartFillIcon(props, ref) {
  return <HeartIcon ref={ref} {...props} weight="fill" />;
}) as PhosphorIcon;

/** The filled note mark, for a dancer the coach has a note on. */
export const NoteFillIcon = forwardRef<
  SVGSVGElement,
  React.ComponentProps<typeof NotePencilIcon>
>(function NoteFillIcon(props, ref) {
  return <NotePencilIcon ref={ref} {...props} weight="fill" />;
}) as PhosphorIcon;

// No hover box: hover only turns the outline heart red. Pressed is a red filled heart.
// Overrides IconToggle's surface-active hover and fg colours so tailwind-merge drops them.
const heartTone =
  "hover:bg-transparent dark:hover:bg-transparent data-pressed:hover:bg-transparent dark:data-pressed:hover:bg-transparent " +
  "hover:text-danger data-pressed:text-danger transition-[color] duration-100 ease-[ease]";

/** The heart toggle: "Favorite NAME" / "Unfavorite NAME". Red when favourited. */
export function FavoriteToggle({
  name,
  pressed,
  onChange,
  disabled,
  size,
  className,
}: {
  name: string;
  pressed: boolean;
  onChange: () => void;
  disabled?: boolean;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <IconToggle
      size={size}
      label={`${pressed ? "Unfavorite" : "Favorite"} ${name}`}
      icon={HeartIcon}
      pressedIcon={HeartFillIcon}
      pressed={pressed}
      onChange={onChange}
      disabled={disabled}
      className={cn(heartTone, className)}
    />
  );
}

/** The "Call" / "Called" pill; icon-only (32px) on phones. */
export function CallToggle({
  name,
  pressed,
  onChange,
  disabled,
  title,
  variant,
  compact = true,
  idleLabel = "Call",
  iconOnly = false,
  className,
}: {
  name: string;
  pressed: boolean;
  onChange: () => void;
  disabled?: boolean;
  title?: string;
  variant?: PillToggleVariant;
  /** Icon-only on phones (table rows). Default true. */
  compact?: boolean;
  /** The label before the dancer is called back. Default "Call". */
  idleLabel?: string;
  /** A round icon-only button at every width. */
  iconOnly?: boolean;
  className?: string;
}) {
  return (
    <PillToggle
      variant={variant}
      aria-label={pressed ? `Undo callback for ${name}` : `Call back ${name}`}
      icon={MegaphoneSimpleIcon}
      pressed={pressed}
      onChange={onChange}
      disabled={disabled}
      title={title}
      className={cn(
        compact && "bp-phone:w-8 bp-phone:justify-center bp-phone:px-0",
        iconOnly && "w-8 justify-center px-0",
        className,
      )}
    >
      <span
        className={cn(
          iconOnly ? "sr-only" : compact && "bp-phone:hidden",
        )}
      >
        {pressed ? "Called" : idleLabel}
      </span>
    </PillToggle>
  );
}
