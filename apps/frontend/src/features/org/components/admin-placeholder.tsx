import { Frame, FramePanel } from "@/components/ui/frame";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowLeftIcon } from "lucide-react";
import type { ReactNode } from "react";

interface AdminPlaceholderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: ReactNode;
  summary?: ReactNode;
  orgSlug: string;
}

export function AdminPlaceholder({
  title,
  subtitle,
  icon: Icon,
  emptyTitle,
  emptyDescription,
  summary,
  orgSlug,
}: AdminPlaceholderProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </header>

      {summary && (
        <div className="border-border/60 bg-muted/20 grid gap-3 rounded-xl border p-4 sm:grid-cols-3">
          {summary}
        </div>
      )}

      <Frame>
        <FramePanel className="p-10">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Icon className="size-6" />
              </EmptyMedia>
              <EmptyTitle>{emptyTitle}</EmptyTitle>
              <EmptyDescription>{emptyDescription}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="outline"
                size="sm"
                render={<Link to="/o/$orgSlug/admin" params={{ orgSlug }} />}
              >
                <ArrowLeftIcon className="size-3.5" />
                Back to dashboard
              </Button>
            </EmptyContent>
          </Empty>
        </FramePanel>
      </Frame>
    </div>
  );
}

interface SummaryStatProps {
  label: string;
  value: ReactNode;
  hint?: string;
}

export function SummaryStat({ label, value, hint }: SummaryStatProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
        {label}
      </span>
      <span className="text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </span>
      {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
    </div>
  );
}
