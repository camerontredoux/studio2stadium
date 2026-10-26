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
  className,
}: {
  name: string;
  pressed: boolean;
  onChange: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <IconToggle
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
        className,
      )}
    >
      <span className={cn(compact && "bp-phone:hidden")}>
        {pressed ? "Called" : "Call"}
      </span>
    </PillToggle>
  );
}
