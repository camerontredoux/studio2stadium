import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@/components/ui/progress";
import { cn } from "@/components/utils/cn";
import { track, trackOncePerSession } from "@/lib/analytics";
import { useSession } from "@/lib/session";
import type {
  PremiumRoadmap,
  RoadmapStep,
  StepKey,
} from "@/shared/premium-roadmap/types";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleIcon,
  LoaderIcon,
  LockIcon,
  SparklesIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  isCollapsedByDefault,
  isComplete,
  nextStep,
  ROADMAP_DAYS,
  stepDetail,
  STEP_COPY,
} from "./steps";

const TITLE = "Your Recruiting Roadmap";
const INTRO =
  "Complete these steps to prepare your profile and start using S2S strategically.";
const DONE_HEADING = "Your recruiting foundation is ready";
const DONE_BODY =
  "Keep your profile current and use your tracker to plan what comes next.";

type Placement = "list" | "summary" | "completed";

function StepLink({
  roadmap,
  stepKey,
  placement,
  children,
  ...button
}: {
  roadmap: PremiumRoadmap;
  stepKey: StepKey;
  placement: Placement;
  children: ReactNode;
} & React.ComponentProps<typeof Button>) {
  const session = useSession();
  const link =
    stepKey === "profile" ? (
      <Link to="/$username" params={{ username: session.username }} />
    ) : stepKey === "video" ? (
      <Link
        to="/$username"
        params={{ username: session.username }}
        search={{ upload: "video" }}
      />
    ) : stepKey === "tracker" ? (
      <Link to="/tracker" />
    ) : (
      <Link to="/explore" />
    );

  const handleClick = () =>
    track("premium_roadmap_step_clicked", {
      step_key: stepKey,
      source_page: "feed",
      placement,
      days_since_start: roadmap.daysSinceStart,
      roadmap_version: roadmap.version,
    });

  return (
    <Button {...button} render={link} onClick={handleClick}>
      {children}
    </Button>
  );
}

function StatusIcon({
  status,
  className,
}: {
  status: RoadmapStep["status"];
  className?: string;
}) {
  const Icon =
    status === "complete"
      ? CheckCircle2Icon
      : status === "processing"
        ? LoaderIcon
        : status === "not_ready"
          ? LockIcon
          : CircleIcon;
  return (
    <Icon
      aria-hidden
      className={cn(
        "size-5 shrink-0",
        status === "complete" && "text-brand",
        status === "processing" && "text-info-foreground animate-spin",
        (status === "incomplete" || status === "not_ready") &&
          "text-muted-foreground",
        className,
      )}
    />
  );
}

function ProgressLine({ roadmap }: { roadmap: PremiumRoadmap }) {
  const { completedCount: done, totalCount: total } = roadmap;
  return (
    <Progress
      value={(done / total) * 100}
      aria-label={`${done} of ${total} completed`}
    >
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {done} of {total} completed
        </span>
        {roadmap.daysSinceStart <= ROADMAP_DAYS && !isComplete(roadmap) && (
          <span className="text-muted-foreground">
            Day {roadmap.daysSinceStart} of {ROADMAP_DAYS}
          </span>
        )}
      </div>
      <ProgressTrack>
        <ProgressIndicator className="bg-brand" />
      </ProgressTrack>
    </Progress>
  );
}

function CompletedBlock({ roadmap }: { roadmap: PremiumRoadmap }) {
  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
      <div className="flex-1">
        <h3 className="font-semibold">{DONE_HEADING}</h3>
        <p className="text-muted-foreground text-sm">{DONE_BODY}</p>
      </div>
      <StepLink roadmap={roadmap} stepKey="tracker" placement="completed">
        View My Recruiting Tracker
      </StepLink>
    </div>
  );
}

// Sends premium_roadmap_viewed the first time the card enters the viewport
// in a browser session.
function useViewedEvent(roadmap: PremiumRoadmap) {
  const session = useSession();
  const ref = useRef<HTMLElement>(null);
  const { version, daysSinceStart, interval, premiumStartedAt } = roadmap;

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      trackOncePerSession(
        `premium_roadmap_viewed:${session.id}`,
        "premium_roadmap_viewed",
        {
          user_id: session.id,
          roadmap_version: version,
          days_since_start: daysSinceStart,
          subscription_interval: interval,
          premium_started_at: premiumStartedAt,
        },
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [session.id, version, daysSinceStart, interval, premiumStartedAt]);

  return ref;
}

export function RoadmapCard({ roadmap }: { roadmap: PremiumRoadmap }) {
  const [open, setOpen] = useState(!isCollapsedByDefault(roadmap));
  const next = nextStep(roadmap);
  const ref = useViewedEvent(roadmap);

  return (
    <section
      ref={ref}
      aria-label={TITLE}
      className="overflow-clip rounded-2xl border"
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="from-brand/10 via-brand/5 to-background relative overflow-clip bg-linear-to-br p-4">
          <div className="text-brand absolute -top-1 -left-2 -z-10 flex items-center gap-2 opacity-10">
            <SparklesIcon className="size-24 rotate-6" />
            <SparklesIcon className="size-16 rotate-186" />
          </div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-semibold">{TITLE}</h2>
              <p className="text-muted-foreground text-sm">{INTRO}</p>
            </div>
            <CollapsibleTrigger
              nativeButton
              render={<Button variant="ghost" size="icon-sm" />}
              aria-label={open ? "Collapse roadmap" : "Expand roadmap"}
            >
              <ChevronDownIcon
                className={cn("transition-transform", open && "rotate-180")}
              />
            </CollapsibleTrigger>
          </div>
          <div className="mt-3">
            <ProgressLine roadmap={roadmap} />
          </div>
          {next && (
            // The collapsed summary animates opposite the step list.
            <Collapsible open={!open}>
              <CollapsibleContent className="duration-300 ease-out">
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
                  <span className="text-sm">
                    Next: {STEP_COPY[next.key].title}
                  </span>
                  <StepLink
                    roadmap={roadmap}
                    stepKey={next.key}
                    placement="summary"
                    size="sm"
                  >
                    {STEP_COPY[next.key].action}
                  </StepLink>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
        <CollapsibleContent className="duration-300 ease-out">
          {isComplete(roadmap) ? (
            <div className="border-t">
              <CompletedBlock roadmap={roadmap} />
            </div>
          ) : (
            <ol className="divide-y border-t">
              {roadmap.steps.map((step) => {
                const isNext = step.key === next?.key;
                return (
                  <li
                    key={step.key}
                    className={cn(
                      // The title centers on the icon; the button's top
                      // meets the drawn circle (Lucide insets it ~2px).
                      "grid grid-cols-[auto_1fr] items-start gap-x-3 p-4 sm:grid-cols-[auto_1fr_auto]",
                      isNext && "bg-brand/5",
                    )}
                  >
                    {/* Outfit's glyphs sit ~1px below center; nudge the icon to match. */}
                    <StatusIcon
                      status={step.status}
                      className="translate-y-px"
                    />
                    <span
                      className={cn(
                        // Trim the line box to the cap height so the
                        // visible text centers on the icon.
                        "self-center font-medium [text-box:trim-both_cap_alphabetic]",
                        step.status === "complete" &&
                          "text-muted-foreground line-through",
                      )}
                    >
                      {STEP_COPY[step.key].title}
                    </span>
                    <p className="text-muted-foreground col-start-2 row-start-2 mt-1 text-sm">
                      {stepDetail(step)}
                    </p>
                    {step.status !== "complete" && (
                      <StepLink
                        roadmap={roadmap}
                        stepKey={step.key}
                        placement="list"
                        size="xs"
                        variant={isNext ? "default" : "outline"}
                        disabled={step.status === "not_ready"}
                        className="col-start-2 row-start-3 mt-3 justify-self-start sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:mt-0.5"
                      >
                        {STEP_COPY[step.key].action}
                      </StepLink>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
