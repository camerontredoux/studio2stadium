import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createLink, type LinkComponent } from "@tanstack/react-router";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import type { IconType } from "react-icons/lib";

const NavLinkComponent = forwardRef<
  HTMLAnchorElement,
  ComponentPropsWithoutRef<"a"> & {
    active?: boolean;
    label: string;
    activeIcon: IconType;
    inactiveIcon: IconType;
  }
>(
  (
    {
      children: _,
      active,
      label,
      activeIcon: ActiveIcon,
      inactiveIcon: InactiveIcon,
      ...props
    },
    ref,
  ) => (
    <TooltipProvider delay={0}>
      <Button
        className="justify-start gap-4 hidden xl:flex"
        size="lg"
        variant={active ? "secondary" : "ghost"}
        render={<a ref={ref} {...props} />}
      >
        {active ? (
          <ActiveIcon className="size-5 sm:size-4.5" />
        ) : (
          <InactiveIcon className="size-5 sm:size-4.5" />
        )}
        <span className="sr-only xl:not-sr-only">{label}</span>
      </Button>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              className="flex xl:hidden"
              size="icon"
              variant={active ? "secondary" : "ghost"}
              render={<a ref={ref} {...props} />}
            >
              {active ? (
                <ActiveIcon className="size-5 sm:size-4.5" />
              ) : (
                <InactiveIcon className="size-5 sm:size-4.5" />
              )}
            </Button>
          }
        />
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
);

const GenericNavLink: LinkComponent<typeof NavLinkComponent> =
  createLink(NavLinkComponent);

export const NavLink: LinkComponent<typeof NavLinkComponent> = (props) => (
  <GenericNavLink
    activeProps={{
      active: true,
    }}
    inactiveProps={{
      active: false,
    }}
    {...props}
  />
);
