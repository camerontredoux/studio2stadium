import {
  ArrowSquareOutIcon,
  CheckIcon,
  GraduationCapIcon,
  MegaphoneIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/event/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogPopup,
  DialogTitle,
} from "@/components/event/dialog";
import { Icon } from "@/components/event/icon";
import { Label } from "@/components/event/label";
import { Tag } from "@/components/event/tag";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/components/utils/cn";
import { rosterQueries } from "@/features/org/api/roster-queries";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { SchoolNameLink } from "@/features/org/components/school-identity";
import { useOrg } from "@/features/org/context/use-org";
import { formatClock } from "@/features/org/lib/event-clock";
import { useEventTimeZone } from "@/features/org/live/shared/use-event-time-zone";

import {
  DancerDialogContext,
  type DancerDialogDancer,
  type DancerDialogOpenOptions,
  type DancerDialogViewer,
} from "./dancer-dialog-context";

export type {
  DancerDialogDancer,
  DancerDialogOpenOptions,
  DancerDialogViewer,
} from "./dancer-dialog-context";

/**
 * Holds one dancer dialog for an area. The admin and coach shells mount it, so
 * any `DancerBib` (or a `useDancerDialog().open(...)` call) below opens it.
 */
export function DancerDialogProvider({
  viewer,
  eventId,
  children,
}: {
  viewer: DancerDialogViewer;
  /** The Org Event the area shows; used when a dancer has no `eventId`. */
  eventId?: string | null;
  children: ReactNode;
}) {
  const [state, setState] = useState<{
    dancer: DancerDialogDancer;
    options?: DancerDialogOpenOptions;
  } | null>(null);
  const [open, setOpen] = useState(false);

  const openDialog = useCallback(
    (dancer: DancerDialogDancer, options?: DancerDialogOpenOptions) => {
      setState({ dancer, options });
      setOpen(true);
    },
    [],
  );

  const value = useMemo(
    () => ({ viewer, open: openDialog }),
    [viewer, openDialog],
  );

  return (
    <DancerDialogContext.Provider value={value}>
      {children}
      <DancerDialog
        viewer={viewer}
        dancer={state?.dancer ?? null}
        eventId={eventId}
        open={open}
        onOpenChange={setOpen}
        onViewProfile={state?.options?.onViewProfile}
      />
    </DancerDialogContext.Provider>
  );
}

export interface DancerDialogProps {
  viewer: DancerDialogViewer;
  /** The dancer to show; the dialog keeps the last one while it animates out. */
  dancer: DancerDialogDancer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fallback Org Event when `dancer.eventId` is missing. */
  eventId?: string | null;
  /** Shows "View full profile" in the footer. */
  onViewProfile?: (rosterId: string) => void;
}

/**
 * A dancer at a glance: bib, name, roster and profile facts, check-in, and
 * the schools that called them back (every school for admins, the coach's own
 * program for coaches). Controlled; most callers use `DancerBib` or
 * `useDancerDialog()` instead.
 */
export function DancerDialog({
  viewer,
  dancer,
  open,
  onOpenChange,
  eventId,
  onViewProfile,
}: DancerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup showCloseButton className="max-w-[440px]">
        {dancer && (
          <DancerDialogContent
            viewer={viewer}
            dancer={dancer}
            eventId={dancer.eventId ?? eventId ?? undefined}
            enabled={open}
            onViewProfile={onViewProfile}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogPopup>
    </Dialog>
  );
}

function DancerDialogContent({
  viewer,
  dancer: summary,
  eventId,
  enabled,
  onViewProfile,
  onClose,
}: {
  viewer: DancerDialogViewer;
  dancer: DancerDialogDancer;
  eventId: string | undefined;
  enabled: boolean;
  onViewProfile?: (rosterId: string) => void;
  onClose: () => void;
}) {
  const { org, hasFeature } = useOrg();
  const timeZone = useEventTimeZone();
  const slug = org.slug;
  const showCallbacks = hasFeature("callbacks");
  const isAdmin = viewer === "admin";

  // Admin: no single Roster Entry GET exists, so search the event's dancer
  // roster by bib (or name) and pick this entry out of the page.
  const rosterSearch =
    summary.bibNumber != null && summary.bibNumber !== ""
      ? String(summary.bibNumber)
      : (summary.lastName ?? summary.firstName ?? "");
  const rosterQuery = useQuery({
    ...rosterQueries.list(slug, eventId ?? "", {
      type: "dancer",
      search: rosterSearch || undefined,
      limit: 25,
    }),
    enabled: enabled && isAdmin && !!eventId && rosterSearch !== "",
    select: (page) => page.data.find((row) => row.id === summary.rosterId),
  });

  // Coach: the scouting detail endpoint has the profile.
  const coachDetailQuery = useQuery({
    ...scoutingQueries.dancer(slug, summary.rosterId, eventId),
    enabled: enabled && !isAdmin,
  });

  const adminCallbacks = useQuery({
    ...scoutingQueries.dancerCallbackDetail(slug, summary.rosterId),
    enabled: enabled && isAdmin && showCallbacks,
  });
  const coachCallbacks = useQuery({
    ...scoutingQueries.coachDancerCallbackDetail(
      slug,
      summary.rosterId,
      eventId,
    ),
    enabled: enabled && !isAdmin && showCallbacks,
  });
  const callbacks = isAdmin ? adminCallbacks : coachCallbacks;

  const row = rosterQuery.data;
  const detail = coachDetailQuery.data;
  const dancer = {
    bibNumber: summary.bibNumber ?? row?.bibNumber ?? detail?.bibNumber ?? null,
    firstName: summary.firstName ?? row?.firstName ?? detail?.firstName ?? "",
    lastName: summary.lastName ?? row?.lastName ?? detail?.lastName ?? "",
    studio: summary.studio ?? row?.profile?.studio ?? detail?.studio ?? null,
    email: summary.email ?? row?.email ?? null,
    gradYear:
      summary.gradYear ?? row?.profile?.gradYear ?? detail?.gradYear ?? null,
    gpa: summary.gpa ?? row?.profile?.gpa ?? detail?.gpa ?? null,
    state: summary.state ?? row?.profile?.state ?? detail?.state ?? null,
    height: summary.height ?? row?.profile?.height ?? detail?.height ?? null,
    danceStyles:
      summary.danceStyles ??
      row?.profile?.danceStyles ??
      detail?.danceStyles ??
      null,
    photo:
      summary.profilePhotoUrl ??
      row?.profile?.profilePhotoUrl ??
      detail?.profilePhotoUrl ??
      null,
    checkedInAt: summary.checkedInAt ?? row?.checkedInAt ?? null,
    isRegistered:
      summary.isRegistered ?? row?.isRegistered ?? detail?.isRegistered,
  };
  const name =
    `${dancer.firstName} ${dancer.lastName}`.trim() || "[Dancer name]";
  const checkInKnown = summary.checkedInAt !== undefined || row !== undefined;

  const facts: { label: string; value: ReactNode; mono?: boolean }[] = [];
  if (dancer.studio) facts.push({ label: "Studio", value: dancer.studio });
  if (dancer.gradYear != null)
    facts.push({ label: "Grad year", value: dancer.gradYear, mono: true });
  if (dancer.gpa != null)
    facts.push({ label: "GPA", value: dancer.gpa.toFixed(1), mono: true });
  if (dancer.state) facts.push({ label: "State", value: dancer.state });
  if (dancer.height)
    facts.push({ label: "Height", value: dancer.height, mono: true });
  if (dancer.danceStyles && dancer.danceStyles.length > 0)
    facts.push({ label: "Styles", value: dancer.danceStyles.join(", ") });
  if (isAdmin && dancer.email)
    facts.push({ label: "Email", value: dancer.email, mono: true });

  const loadingFacts = isAdmin
    ? rosterQuery.isLoading
    : coachDetailQuery.isLoading;

  return (
    <>
      <div className="border-line flex shrink-0 items-center gap-(--space-14) border-b p-(--space-16) pr-12">
        <BibTile bib={dancer.bibNumber} />
        <div className="flex min-w-0 flex-col gap-(--space-4)">
          <DialogTitle className="truncate text-[17px]">{name}</DialogTitle>
          <DialogDescription
            render={<div />}
            className="type-meta text-fg-2 flex flex-wrap items-center gap-x-(--space-6) gap-y-(--space-2)"
          >
            {dancer.isRegistered !== undefined && (
              <span className="type-tag text-fg">
                {dancer.isRegistered ? "Active" : "Pending"}
              </span>
            )}
            {dancer.isRegistered !== undefined && checkInKnown && (
              <span aria-hidden className="text-fg-3">
                ·
              </span>
            )}
            {checkInKnown &&
              (dancer.checkedInAt ? (
                <span className="text-fg-2 inline-flex items-center gap-(--space-4) font-mono tabular-nums">
                  <Icon icon={CheckIcon} className="text-event-accent" />
                  Checked in {formatClock(dancer.checkedInAt, timeZone)}
                </span>
              ) : (
                <span className="text-fg-3 font-mono">Not checked in</span>
              ))}
          </DialogDescription>
        </div>
      </div>

      <DialogBody className="gap-0 p-0">
        <Section title="Dancer">
          {facts.length > 0 ? (
            <dl className="m-0 grid grid-cols-[96px_minmax(0,1fr)] gap-x-(--space-12) gap-y-(--space-8)">
              {facts.map((fact) => (
                <div key={fact.label} className="contents">
                  <dt className="type-body text-fg-3">{fact.label}</dt>
                  <dd
                    className={cn(
                      "text-fg m-0 min-w-0 truncate",
                      fact.mono ? "type-data" : "type-body",
                    )}
                  >
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="type-body text-fg-3 m-0">
              {loadingFacts ? "Loading…" : "No profile details yet"}
            </p>
          )}
        </Section>

        {showCallbacks && (
          <Section
            title={isAdmin ? "Callbacks" : "Your callbacks"}
            count={callbacks.data?.length}
          >
            {callbacks.isLoading ? (
              <p className="type-body text-fg-3 m-0">Loading…</p>
            ) : callbacks.isError ? (
              <p className="type-body text-danger m-0">
                Couldn't load callbacks
              </p>
            ) : !callbacks.data || callbacks.data.length === 0 ? (
              <p className="type-body text-fg-3 m-0">
                {isAdmin
                  ? "No callbacks yet"
                  : "You haven't called this dancer back"}
              </p>
            ) : (
              <ul className="border-line m-0 flex list-none flex-col rounded-(--radius-8) border p-0">
                {callbacks.data.map((callback) => (
                  <CallbackRow
                    key={callback.coachRosterId}
                    callback={callback}
                  />
                ))}
              </ul>
            )}
          </Section>
        )}
      </DialogBody>

      <DialogFooter>
        {isAdmin ? (
          <Button
            variant="ghost"
            size="lg"
            className="mr-auto"
            render={
              <Link
                to="/o/$orgSlug/admin/dancers"
                params={{ orgSlug: slug }}
                search={
                  {
                    q:
                      dancer.bibNumber != null
                        ? String(dancer.bibNumber)
                        : name,
                  } as never
                }
                onClick={onClose}
              />
            }
          >
            <Icon icon={ArrowSquareOutIcon} />
            Open in roster
          </Button>
        ) : onViewProfile ? (
          <Button
            variant="ghost"
            size="lg"
            className="mr-auto"
            onClick={() => {
              onClose();
              onViewProfile(summary.rosterId);
            }}
          >
            <Icon icon={UserIcon} />
            View full profile
          </Button>
        ) : null}
        <DialogClose render={<Button variant="secondary" size="lg" />}>
          Close
        </DialogClose>
      </DialogFooter>
    </>
  );
}

/** The 56px light bib tile, as on the roster detail sheet. */
function BibTile({ bib }: { bib: number | string | null }) {
  return (
    <div
      aria-hidden={bib == null}
      className="bg-fg text-on-fg grid size-14 shrink-0 place-items-center rounded-(--radius-10) font-mono text-[24px] leading-none font-medium tabular-nums"
    >
      {bib ?? "—"}
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section className="border-line flex flex-col gap-(--space-10) border-b p-(--space-16) last:border-b-0">
      <div className="flex items-center gap-(--space-8)">
        <Label render={<h3 />} className="m-0">
          {title}
        </Label>
        {count != null && count > 0 && (
          <span className="type-data-sm text-fg-3">{count}</span>
        )}
      </div>
      {children}
    </section>
  );
}

type CallbackDetail = {
  coachRosterId: string;
  username: string | null;
  firstName: string;
  lastName: string;
  organization: string | null;
  avatarUrl: string | null;
  showcaseNumbers: number[];
  callbackCount: number;
  releasedCount: number;
};

function CallbackRow({ callback }: { callback: CallbackDetail }) {
  const allReleased = callback.releasedCount === callback.callbackCount;
  const noneReleased = callback.releasedCount === 0;
  const showcases =
    callback.showcaseNumbers.length === 1
      ? `Showcase ${callback.showcaseNumbers[0]}`
      : `Showcases ${callback.showcaseNumbers.join(", ")}`;

  return (
    <li className="border-line flex items-center gap-(--space-10) border-b px-(--space-10) py-(--space-8) last:border-b-0">
      <Avatar className="size-7 shrink-0 rounded-(--radius-6)">
        <AvatarImage
          src={callback.avatarUrl ?? undefined}
          alt=""
          className="object-cover"
        />
        <AvatarFallback className="bg-surface-chip text-fg-3 rounded-(--radius-6)">
          <Icon icon={GraduationCapIcon} />
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col">
        <SchoolNameLink
          username={callback.username}
          organization={callback.organization}
          className="type-body-strong text-fg"
        />
        <span className="type-caption text-fg-3 truncate">
          {callback.firstName} {callback.lastName} ·{" "}
          <span className="font-mono tabular-nums">{showcases}</span>
        </span>
      </div>
      <Tag tone={noneReleased ? "muted" : "live"} className="shrink-0">
        <Icon icon={MegaphoneIcon} />
        {allReleased
          ? "Released"
          : noneReleased
            ? "Not released"
            : `${callback.releasedCount}/${callback.callbackCount} released`}
      </Tag>
    </li>
  );
}
