import { WarningIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/event/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/event/dialog";
import { Icon } from "@/components/event/icon";
import { scoutingQueries } from "@/features/org/api/scouting-queries";

/**
 * Publishing a showcase (the old callbacks page's Publish dialog): locks in each
 * school's top callbacks and shows them to dancers. When schools are over the
 * cap it lists them and offers "Publish all".
 */
export function PublishCallbacksDialog({
  orgSlug,
  open,
  onOpenChange,
  pending,
  onConfirm,
}: {
  orgSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onConfirm: (publishAll: boolean) => void;
}) {
  const { data: preview } = useQuery({
    ...scoutingQueries.publishPreview(orgSlug),
    enabled: open,
  });
  const max = preview?.maxCallbacks ?? -1;
  const willDrop = preview?.totalWillDrop ?? 0;
  const overCap = preview?.coaches.filter((coach) => coach.willDrop > 0) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Publish callbacks</DialogTitle>
          <DialogDescription>
            {max === -1
              ? "Locks in every school's callbacks and shows them to dancers."
              : `Locks in each school's top ${max} callbacks (by rating, then most recent) and shows them to dancers.`}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {willDrop > 0 && preview ? (
            <div className="border-line-control flex flex-col gap-(--space-8) rounded-(--radius-6) border px-(--space-10) py-(--space-8)">
              <p className="text-fg m-0 flex items-center gap-(--space-6) text-[13px] font-medium">
                <Icon icon={WarningIcon} className="text-danger" />
                {willDrop} callback{willDrop === 1 ? "" : "s"} won't be released
              </p>
              <p className="text-fg-2 m-0 text-[12.5px] leading-[1.5]">
                {preview.coachesOverCap} school
                {preview.coachesOverCap === 1 ? "" : "s"} picked more than {max}
                . Those dancers won't see the callback unless you publish all.
              </p>
              <ul className="m-0 flex list-none flex-col gap-(--space-2) p-0">
                {overCap.map((coach) => (
                  <li
                    key={coach.coachRosterId}
                    className="text-fg-2 flex justify-between gap-(--space-12) text-[12.5px]"
                  >
                    <span className="truncate">
                      {coach.organization ||
                        `${coach.firstName} ${coach.lastName}`}
                    </span>
                    <span className="text-fg-3 shrink-0 font-mono tabular-nums">
                      {coach.willPublish} of {coach.total}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-fg-2 m-0 text-[13px]">
              {preview
                ? `${preview.totalWillPublish} callback${preview.totalWillPublish === 1 ? "" : "s"} will be released.`
                : "Checking callbacks…"}
            </p>
          )}
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" size="lg" />}>
            Cancel
          </DialogClose>
          {willDrop > 0 && preview && (
            <Button
              size="lg"
              disabled={pending}
              onClick={() => onConfirm(true)}
            >
              Publish all {preview.totalCallbacks}
            </Button>
          )}
          <Button
            variant="primary"
            size="lg"
            disabled={pending || !preview}
            onClick={() => onConfirm(false)}
          >
            {pending
              ? "Publishing…"
              : willDrop > 0
                ? `Publish top ${max}`
                : "Publish"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

/** Starting the next showcase archives the published one; coaches start from an empty list. */
export function NextShowcaseDialog({
  open,
  onOpenChange,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup role="alertdialog">
        <DialogHeader className="pb-(--space-16)">
          <DialogTitle>Start the next showcase?</DialogTitle>
          <DialogDescription>
            The published showcase moves to the history and a new round starts.
            Coaches begin with an empty callback list.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" size="lg" />}>
            Cancel
          </DialogClose>
          <Button
            variant="primary"
            size="lg"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? "Starting…" : "Start next showcase"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
