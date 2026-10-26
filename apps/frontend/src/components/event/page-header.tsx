import { useRender } from "@base-ui/react/use-render";
import * as React from "react";

import { cn } from "@/components/utils/cn";

/** Content every `PageHeader` shows after its actions, set by the area shell. */
const PageHeaderEndContext = React.createContext<React.ReactNode>(null);

type PageHeaderCrumb = {
  /** The event name, linking back to the dashboard. */
  label: React.ReactNode;
  /** The link element, e.g. `<Link to="/o/$orgSlug/admin" params={…} />`. Defaults to `<a href>`. */
  render?: useRender.RenderProp;
  href?: string;
};

type PageHeaderProps = Omit<React.ComponentProps<"header">, "title"> & {
  /** The page title (15px, 600); truncates. */
  title: React.ReactNode;
  /** Sub-pages: the breadcrumb back to the event, followed by a slash. */
  crumb?: PageHeaderCrumb;
  /** Usually a `LiveBadge`. On the dashboard it shows at 1000px and under (the rail carries it above). */
  status?: React.ReactNode;
  /** Show `status` at every width (pages without the rail). */
  statusAlways?: boolean;
  /** The page's buttons, at the right. */
  actions?: React.ReactNode;
};

function Crumb({ label, render, href }: PageHeaderCrumb) {
  const link = useRender({
    defaultTagName: "a",
    render,
    props: { className: "s2s-header-crumb-link", href, children: label },
  });
  return (
    <span className="s2s-header-crumb">
      {link}
      <span aria-hidden="true" className="s2s-header-crumb-slash">
        /
      </span>
    </span>
  );
}

/**
 * The 56px bar at the top of the content column: optional crumb, title, live status and
 * dates on the title's line, and actions at the right.
 */
function PageHeader({
  title,
  crumb,
  status,
  statusAlways = false,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  const end = React.useContext(PageHeaderEndContext);
  return (
    <header className={cn("s2s-header", className)} {...props}>
      {crumb && <Crumb {...crumb} />}
      <h1 className="s2s-header-title">{title}</h1>
      {status !== undefined && (
        <div
          className="s2s-header-status"
          data-always={statusAlways ? "" : undefined}
        >
          {status}
        </div>
      )}
      <span className="s2s-header-spacer" />
      {actions !== undefined && (
        <div className="s2s-header-actions">{actions}</div>
      )}
      {end}
    </header>
  );
}

export { PageHeader, PageHeaderEndContext };
export type { PageHeaderCrumb, PageHeaderProps };
