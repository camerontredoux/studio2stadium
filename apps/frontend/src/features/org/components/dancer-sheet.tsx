import { ArrowSquareOutIcon, PlayIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useId, useState } from "react";

import { Button } from "@/components/event/button";
import { Chip, ChipRow } from "@/components/event/chip";
import { Icon } from "@/components/event/icon";
import { Rating } from "@/components/event/rating";
import { Textarea } from "@/components/event/textarea";
import { BusyLabel } from "@/features/org/live/shared/busy-label";
import { cn } from "@/components/utils/cn";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import {
  SchoolAvatar,
  SchoolNameLink,
} from "@/features/org/components/school-identity";
import { useOrg } from "@/features/org/context/use-org";
import { useCoachScouting } from "@/features/org/live/coach/coach-scouting";
import {
  DetailSheet,
  DetailSheetBody,
  DetailSheetHeader,
  DetailSheetRow,
  DetailSheetRows,
  DetailSheetSection,
  DetailSheetTile,
  DetailSheetValue,
} from "@/features/org/live/shared/detail-sheet";
import {
  CallToggle,
  FavoriteToggle,
} from "@/features/org/live/coach/scouting-controls";
import { $api, type ApiSchemas } from "@/lib/api/client";

type DancerDetail = ApiSchemas["OrgsIdDancersIdResponse"];
type PublicVideo = ApiSchemas["DancersIdResponse"]["videos"][number];

interface DancerSheetProps {
  rosterId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Show the coach's marks without the controls that write (another event, or the admin surface). */
  readOnly?: boolean;
  /** Event whose scouting marks to show — defaults to the org's active event. */
  eventId?: string;
  eventName?: string;
  /**
   * Render the admin view of a dancer's callbacks (every program). Defaults to
   * false — the coach view, scoped to the viewer's own program. This tracks the
   * surface the sheet is on, not the viewer's membership, so an admin browsing
   * the coach dashboard (view-as-coach) sees the coach-scoped list.
   */
  admin?: boolean;
}

/**
 * A dancer's full detail, opened from a row: their video and profile first,
 * then the coach's rating, favorite, callback and private note (each saved as
 * it changes; the note on "Save note"), then which schools called them back.
 */
export function DancerSheet({ rosterId, open, ...props }: DancerSheetProps) {
  // DetailSheet mounts closed and opens on the next frame, so the first open
  // animates.
  if (!rosterId) return null;
  return (
    <DetailSheet
      open={open}
      onOpenChange={props.onOpenChange}
      data-testid="dancer-sheet"
    >
      <DancerSheetContent key={rosterId} rosterId={rosterId} {...props} />
    </DetailSheet>
  );
}

function DancerSheetContent({
  rosterId,
  onOpenChange,
  readOnly = false,
  eventId,
  eventName,
  admin = false,
}: Omit<DancerSheetProps, "open" | "rosterId"> & { rosterId: string }) {
  const { org, hasFeature } = useOrg();
  const {
    data: dancer,
    isPending,
    isError,
    refetch,
  } = useQuery(scoutingQueries.dancer(org.slug, rosterId, eventId));

  const close = () => onOpenChange(false);

  if (!dancer) {
    return (
      <>
        <DetailSheetHeader title="Dancer" onClose={close} />
        <div className="text-fg-3 type-body flex flex-1 flex-col items-center justify-center gap-(--space-10) p-(--space-24)">
          {isPending ? (
            <BusyLabel label="Loading dancer…" />
          ) : (
            isError && (
              <>
                <span>Couldn’t load this dancer</span>
                <Button onClick={() => void refetch()}>Try again</Button>
              </>
            )
          )}
        </div>
      </>
    );
  }

  const name = `${dancer.firstName} ${dancer.lastName}`.trim();
  const meta = [
    dancer.gradYear ? `Class of ${dancer.gradYear}` : null,
    dancer.studio,
    dancer.location ?? dancer.state,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      {/* Header: bib tile, name, class/studio/state, close. */}
      <DetailSheetHeader
        tile={
          <DetailSheetTile
            className={
              String(dancer.bibNumber ?? "").length > 3
                ? "text-[18px]"
                : "text-[24px]"
            }
          >
            {dancer.bibNumber != null ? (
              <>
                <span className="sr-only">Bib </span>
                {String(dancer.bibNumber)}
              </>
            ) : (
              <span aria-hidden="true">–</span>
            )}
          </DetailSheetTile>
        }
        title={name}
        meta={
          !dancer.isRegistered ? "Not registered" : meta || "No profile details"
        }
        onClose={close}
      />

      <DetailSheetBody>
        {dancer.username && dancer.isRegistered && (
          <DancerVideos username={dancer.username} name={name} />
        )}
        <ProfileSection dancer={dancer} />
        <ScoutingSection
          dancer={dancer}
          name={name}
          readOnly={readOnly}
          eventName={eventName}
        />
        {hasFeature("callbacks") && (
          <CallbacksSection
            rosterId={rosterId}
            admin={admin}
            eventId={eventId}
          />
        )}
      </DetailSheetBody>
    </>
  );
}

/** The first video large (16:9), the rest as thumbnails that swap it in. */
function DancerVideos({ username, name }: { username: string; name: string }) {
  const { data, isPending } = useQuery(
    $api.queryOptions("get", "/dancers/{username}", {
      params: { path: { username } },
    }),
  );
  const videos = (data?.videos ?? []).filter((video) => video.mediaUrl);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const current = videos.find((v) => v.id === currentId) ?? videos[0];

  if (isPending) {
    return (
      <div className="bg-bg-000 grid aspect-video place-items-center">
        <BusyLabel label="Loading video…" />
      </div>
    );
  }
  if (!current) {
    return (
      <div className="bg-bg-000 text-fg-3 type-body flex aspect-[16/6] items-center justify-center gap-(--space-6)">
        <Icon icon={PlayIcon} />
        No videos yet
      </div>
    );
  }

  return (
    <section aria-label="Videos" className="flex flex-col">
      <iframe
        key={current.id}
        src={current.mediaUrl}
        title={current.caption || `${name} video`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="bg-bg-000 block aspect-video w-full border-0"
      />
      {current.caption && (
        <p className="type-meta text-fg-2 m-0 px-(--space-16) pt-(--space-10)">
          {current.caption}
        </p>
      )}
      {videos.length > 1 && (
        <div className="flex gap-(--space-6) overflow-x-auto px-(--space-16) pt-(--space-10)">
          {videos.map((video) => (
            <VideoThumb
              key={video.id}
              video={video}
              current={video.id === current.id}
              onClick={() => setCurrentId(video.id)}
            />
          ))}
        </div>
      )}
      <div className="h-(--space-14)" />
    </section>
  );
}

function VideoThumb({
  video,
  current,
  onClick,
}: {
  video: PublicVideo;
  current: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={current}
      aria-label={video.caption || "Play video"}
      className={cn(
        "s2s-focus bg-bg-000 relative h-[45px] w-[80px] shrink-0 cursor-pointer overflow-hidden rounded-(--radius-6) border",
        current ? "border-fg" : "border-line hover:border-line-hover",
      )}
    >
      {video.thumbnail && (
        <img src={video.thumbnail} alt="" className="size-full object-cover" />
      )}
      <span className="text-fg absolute inset-0 grid place-items-center">
        <Icon icon={PlayIcon} />
      </span>
    </button>
  );
}

function ProfileSection({ dancer }: { dancer: DancerDetail }) {
  const username = dancer.username;
  return (
    <DetailSheetSection
      title="Profile"
      aside={
        username &&
        dancer.isRegistered && (
          <Button
            variant="ghost"
            size="sm"
            render={
              <Link to="/$username" params={{ username }} target="_blank" />
            }
          >
            Full profile
            <Icon icon={ArrowSquareOutIcon} />
          </Button>
        )
      }
    >
      <DetailSheetRows>
        <DetailSheetRow label="Class">
          <DetailSheetValue value={dancer.gradYear} mono />
        </DetailSheetRow>
        <DetailSheetRow label="GPA">
          <DetailSheetValue
            value={dancer.gpa != null ? dancer.gpa.toFixed(2) : null}
            mono
          />
        </DetailSheetRow>
        <DetailSheetRow label="Studio">
          <DetailSheetValue value={dancer.studio} />
        </DetailSheetRow>
        <DetailSheetRow label="High school">
          <DetailSheetValue value={dancer.highSchool} />
        </DetailSheetRow>
        <DetailSheetRow label="Location">
          <DetailSheetValue value={dancer.location ?? dancer.state} />
        </DetailSheetRow>
        <DetailSheetRow label="Height">
          <DetailSheetValue value={dancer.height} mono />
        </DetailSheetRow>
        {dancer.danceStyles && dancer.danceStyles.length > 0 && (
          <DetailSheetRow label="Styles">
            <ChipRow className="py-(--space-4)">
              {dancer.danceStyles.map((style) => (
                <Chip key={style}>{style}</Chip>
              ))}
            </ChipRow>
          </DetailSheetRow>
        )}
      </DetailSheetRows>
      {dancer.bio && (
        <p className="type-body-long text-fg-2 m-0 whitespace-pre-wrap">
          {dancer.bio}
        </p>
      )}
    </DetailSheetSection>
  );
}

/**
 * The coach's marks. A past event (or the admin surface) is read-only, but the
 * coach still sees what she scouted there, so the marks render either way and
 * only the controls that write are withheld.
 */
function ScoutingSection({
  dancer,
  name,
  readOnly,
  eventName,
}: {
  dancer: DancerDetail;
  name: string;
  readOnly: boolean;
  eventName?: string;
}) {
  const scouting = useCoachScouting();
  const noteId = useId();
  const savedNote = dancer.note ?? "";
  const [draft, setDraft] = useState<string | null>(null);
  const note = draft ?? savedNote;
  const dirty = draft !== null && draft.trim() !== savedNote.trim();

  const saveNote = async () => {
    if (!dirty || draft === null) return;
    if (await scouting.saveNote(dancer.rosterId, draft)) setDraft(null);
  };

  if (readOnly && !dancer.isViewerRostered) {
    return (
      <DetailSheetSection title="Your scouting">
        <p className="type-body text-fg-3 m-0">
          {eventName
            ? `You weren’t rostered at ${eventName}, so there’s nothing scouted here.`
            : "You weren’t rostered at this event, so there’s nothing scouted here."}
        </p>
      </DetailSheetSection>
    );
  }

  return (
    <DetailSheetSection
      title="Your scouting"
      aside={
        eventName && (
          <span className="type-meta text-fg-3 truncate">{eventName}</span>
        )
      }
    >
      <DetailSheetRows>
        <DetailSheetRow label="Rating">
          <Rating
            label={name}
            value={dancer.rating ?? 0}
            max={scouting.ratingMax}
            readOnly={readOnly}
            onValueChange={(value) => scouting.rate(dancer.rosterId, value)}
          />
        </DetailSheetRow>
        <DetailSheetRow label="Favorite">
          {readOnly ? (
            <DetailSheetValue
              value={dancer.isFavorited ? "Favorited" : null}
              empty="No"
            />
          ) : (
            <FavoriteToggle
              name={name}
              pressed={dancer.isFavorited}
              onChange={() => void scouting.toggleFavorite(dancer)}
              className="-ms-[6px]"
            />
          )}
        </DetailSheetRow>
        {scouting.callbacksEnabled && (
          <DetailSheetRow label="Callback">
            {readOnly ? (
              <DetailSheetValue
                value={dancer.isCalledBack ? "Called back" : null}
                empty="No"
              />
            ) : (
              <CallToggle
                name={name}
                pressed={dancer.isCalledBack}
                onChange={() => void scouting.toggleCallback(dancer)}
                variant="outline"
                compact={false}
              />
            )}
          </DetailSheetRow>
        )}
      </DetailSheetRows>
      <div className="flex flex-col gap-(--space-8)">
        <label htmlFor={noteId} className="type-label text-fg-3">
          Private note
        </label>
        {readOnly ? (
          <p
            id={noteId}
            className={cn(
              "type-body m-0 whitespace-pre-wrap",
              savedNote ? "text-fg-2" : "text-fg-3",
            )}
          >
            {savedNote || "No note from this event"}
          </p>
        ) : (
          <>
            <Textarea
              id={noteId}
              placeholder="Add a note…"
              value={note}
              onChange={(event) => setDraft(event.target.value)}
              className="max-w-none"
            />
            <span className="flex gap-(--space-8)">
              <Button
                onClick={() => void saveNote()}
                disabled={!dirty || scouting.savingNote}
              >
                {scouting.savingNote ? (
                  <BusyLabel label="Saving…" />
                ) : (
                  "Save note"
                )}
              </Button>
              {dirty && (
                <Button variant="ghost" onClick={() => setDraft(null)}>
                  Discard
                </Button>
              )}
            </span>
          </>
        )}
      </div>
    </DetailSheetSection>
  );
}

/**
 * Which schools called this dancer back. Admins see every program (including
 * callbacks the current showcase hasn't published yet); a coach sees only her
 * own program, scoped server-side.
 */
function CallbacksSection({
  rosterId,
  admin,
  eventId,
}: {
  rosterId: string;
  admin: boolean;
  eventId?: string;
}) {
  const { org } = useOrg();
  const adminQuery = useQuery({
    ...scoutingQueries.dancerCallbackDetail(org.slug, rosterId),
    enabled: admin,
  });
  const coachQuery = useQuery({
    ...scoutingQueries.coachDancerCallbackDetail(org.slug, rosterId, eventId),
    enabled: !admin,
  });
  const { data: callbacks, isPending } = admin ? adminQuery : coachQuery;

  return (
    <DetailSheetSection title={admin ? "Callbacks" : "Your callbacks"}>
      {isPending ? (
        <BusyLabel label="Loading callbacks…" />
      ) : !callbacks || callbacks.length === 0 ? (
        <p className="type-body text-fg-3 m-0">
          {admin
            ? "No schools have called this dancer back"
            : "You haven’t called this dancer back"}
        </p>
      ) : (
        <ul className="border-line m-0 flex list-none flex-col rounded-(--radius-8) border p-0">
          {callbacks.map((cb) => {
            const status =
              cb.releasedCount === cb.callbackCount
                ? "Released"
                : cb.releasedCount === 0
                  ? "Not released"
                  : `${cb.releasedCount} of ${cb.callbackCount} released`;
            return (
              <li
                key={cb.coachRosterId}
                className="border-line-soft flex min-h-12 items-center gap-(--space-10) border-b px-(--space-12) py-(--space-8) last:border-b-0"
              >
                <SchoolAvatar
                  avatarUrl={cb.avatarUrl}
                  organization={cb.organization}
                  className="size-7"
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <SchoolNameLink
                    username={cb.username}
                    organization={cb.organization}
                    className="type-body text-fg truncate font-medium"
                  />
                  <span className="type-meta text-fg-3 truncate">
                    {cb.firstName} {cb.lastName} ·{" "}
                    {cb.showcaseNumbers.length === 1
                      ? `Showcase ${cb.showcaseNumbers[0]}`
                      : `Showcases ${cb.showcaseNumbers.join(", ")}`}
                  </span>
                </div>
                <span
                  className={cn(
                    "type-label shrink-0",
                    cb.releasedCount === 0 ? "text-amber" : "text-fg-2",
                  )}
                >
                  {status}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </DetailSheetSection>
  );
}
