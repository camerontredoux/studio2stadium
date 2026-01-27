import { Button } from "@/components/ui/button";
import { createLink, type LinkComponent } from "@tanstack/react-router";
import { forwardRef, Fragment, type ComponentPropsWithoutRef } from "react";

const NavLinkComponent = forwardRef<
  HTMLAnchorElement,
  ComponentPropsWithoutRef<"a"> & { active?: boolean; label: string }
>(({ children, active, label, ...props }, ref) => (
  <Fragment>
    <Button
      className="justify-start gap-4 hidden xl:flex"
      size="lg"
      variant={active ? "default" : "ghost"}
      render={<a ref={ref} {...props} />}
    >
      {children} <span className="sr-only xl:not-sr-only">{label}</span>
    </Button>

    <Button
      className="flex xl:hidden"
      size="sidebar"
      variant={active ? "default" : "ghost"}
      render={<a ref={ref} {...props} />}
    >
      {children}
    </Button>
  </Fragment>
));

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
