import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { CaretDownIcon } from "@phosphor-icons/react";
import type * as React from "react";

import {
  AccordionPanel as UiAccordionPanel,
  Accordion as UiAccordion,
  AccordionItem as UiAccordionItem,
} from "@/components/ui/accordion";
import { cn } from "@/components/utils/cn";

import { Icon } from "./icon";

type AccordionProps = React.ComponentProps<typeof UiAccordion>;

/**
 * FAQ questions and answers, one under another in a panel (keep the panel at most
 * 760px wide). Control it with `value` (open item values) and `onValueChange`;
 * pass `multiple` to let several stay open.
 */
function Accordion(props: AccordionProps) {
  return <UiAccordion {...props} />;
}

type AccordionItemProps = React.ComponentProps<typeof UiAccordionItem>;

/** One question and answer, with a line-soft divider under it. */
function AccordionItem({ className, ...props }: AccordionItemProps) {
  return (
    <UiAccordionItem
      className={cn("border-line-soft border-b last:border-b", className)}
      {...props}
    />
  );
}

type AccordionTriggerProps = AccordionPrimitive.Trigger.Props & {
  /** Heading level wrapping the question. Default 2. */
  level?: 2 | 3 | 4;
};

/** The 48px question row; its caret turns 180° and brightens when open. */
function AccordionTrigger({
  level = 2,
  className,
  children,
  ...props
}: AccordionTriggerProps) {
  const Heading = `h${level}` as const;
  return (
    <AccordionPrimitive.Header render={<Heading />} className="m-0 flex">
      <AccordionPrimitive.Trigger
        className={cn(
          "group type-nav text-fg hover:bg-surface-hover s2s-focus flex min-h-12 w-full flex-1 cursor-pointer items-center gap-(--space-12) border-0 bg-transparent px-(--space-14) text-left focus-visible:-outline-offset-2 disabled:pointer-events-none disabled:opacity-35",
          className,
        )}
        {...props}
      >
        {children}
        <Icon
          icon={CaretDownIcon}
          className="text-fg-3 group-data-panel-open:text-fg ml-auto transition-transform duration-150 group-data-panel-open:rotate-180"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

type AccordionPanelProps = React.ComponentProps<typeof UiAccordionPanel>;

/** The answer, body-long in fg-2. Keep it to a few sentences. */
function AccordionPanel({ className, ...props }: AccordionPanelProps) {
  return (
    <UiAccordionPanel
      className={cn(
        "type-body-long text-fg-2 m-0 px-(--space-14) pt-0 pb-(--space-16)",
        className,
      )}
      {...props}
    />
  );
}

export { Accordion, AccordionItem, AccordionPanel, AccordionTrigger };
export type {
  AccordionItemProps,
  AccordionPanelProps,
  AccordionProps,
  AccordionTriggerProps,
};
