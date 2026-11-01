import { PaperPlaneTiltIcon, SkipForwardIcon } from "@phosphor-icons/react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Button } from "@/components/event/button";
import { Icon } from "@/components/event/icon";
import { toastManager } from "@/components/ui/toast-manager";
import {
  ADMIN_CALLBACKS_KEY_PREFIX,
  scoutingQueries,
} from "@/features/org/api/scouting-queries";
import { useTransmitSubscription } from "@/features/org/hooks/use-transmit";
import { $api } from "@/lib/api/client";

import { NextShowcaseDialog, PublishCallbacksDialog } from "./showcase-dialogs";

/**
 * The active event's showcase state and its one action, shared by the Callbacks
 * widget and the Callbacks page: the current showcase and its bibs, the earlier
 * published ones, live refresh, and "Publish" (with the cap confirm) or "Next
 * showcase". Render `primaryAction` where the button goes and `dialogs` once.
 */
export function useShowcaseControls(
  orgSlug: string,
  {
    size = "sm",
    primary = false,
  }: {
    size?: "sm" | "md";
    /** Fill Publish in the primary colour (page header). Widget heads keep every command secondary. */
    primary?: boolean;
  } = {},
) {
  const qc = useQueryClient();
  // Paged in bib order: the widget's peek needs only the first page, and the
  // full list loads as it scrolls. A live refresh refetches the loaded pages.
  const current = useInfiniteQuery(scoutingQueries.adminCallbackPages(orgSlug));
  const showcases = useQuery(scoutingQueries.showcases(orgSlug));
  const [publishOpen, setPublishOpen] = useState(false);
  const [nextOpen, setNextOpen] = useState(false);

  const refresh = () => {
    void qc.invalidateQueries({
      queryKey: ADMIN_CALLBACKS_KEY_PREFIX,
    });
    void qc.invalidateQueries({
      queryKey: scoutingQueries.showcases(orgSlug).queryKey,
    });
    void qc.invalidateQueries({
      queryKey: scoutingQueries.publishPreview(orgSlug).queryKey,
    });
  };
  useTransmitSubscription(`orgs/${orgSlug}/callbacks`, refresh);
  useTransmitSubscription(`orgs/${orgSlug}/showcases`, refresh);

  const publish = $api.useMutation("post", "/orgs/{slug}/showcases/publish", {
    onSuccess: () => {
      setPublishOpen(false);
      toastManager.add({ title: "Callbacks published", type: "success" });
      refresh();
    },
    onError: () => {
      toastManager.add({ title: "Couldn't publish callbacks", type: "error" });
    },
  });
  const next = $api.useMutation("post", "/orgs/{slug}/showcases/next", {
    onSuccess: () => {
      setNextOpen(false);
      toastManager.add({ title: "Next showcase started", type: "success" });
      refresh();
    },
    onError: () => {
      toastManager.add({
        title: "Couldn't start the next showcase",
        type: "error",
      });
    },
  });

  const pages = current.data?.pages;
  const totals = pages?.[0];
  const showcase = totals?.showcase;
  const bibs = useMemo(
    () => pages?.flatMap((page) => page.bibs) ?? [],
    [pages],
  );
  /** Every called-back dancer, loaded or not. */
  const total = totals?.uniqueCallbacks ?? 0;
  const more = {
    hasMore: current.hasNextPage && !current.isFetchNextPageError,
    loadingMore: current.isFetchingNextPage,
    onLoadMore: () => void current.fetchNextPage(),
  };
  const isPublished = showcase?.status === "published";
  // The number Publish will release (each school's top picks), as the confirm shows it.
  const preview = useQuery({
    ...scoutingQueries.publishPreview(orgSlug),
    enabled: showcase != null && !isPublished && total > 0,
  });
  const toPublish = preview.data?.totalWillPublish;
  const earlier = (showcases.data ?? [])
    .filter((s) => s.status === "published" && s.id !== showcase?.id)
    .sort((a, b) => b.number - a.number);

  const primaryAction = showcase && (
    <>
      {isPublished ? (
        <Button size={size} onClick={() => setNextOpen(true)}>
          <Icon icon={SkipForwardIcon} />
          Next showcase
        </Button>
      ) : (
        <Button
          size={size}
          variant={primary ? "primary" : "secondary"}
          disabled={total === 0}
          title={total === 0 ? "No callbacks to publish yet" : undefined}
          onClick={() => setPublishOpen(true)}
        >
          <Icon icon={PaperPlaneTiltIcon} />
          Publish
          {total > 0 && toPublish != null && (
            <span
              className="font-mono tabular-nums opacity-70"
              aria-label={`${toPublish} callbacks`}
            >
              {toPublish}
            </span>
          )}
        </Button>
      )}
    </>
  );

  const dialogs = (
    <>
      <PublishCallbacksDialog
        orgSlug={orgSlug}
        open={publishOpen}
        onOpenChange={setPublishOpen}
        pending={publish.isPending}
        onConfirm={(publishAll) =>
          publish.mutate({
            params: { path: { slug: orgSlug } },
            body: { publishAll },
          })
        }
      />
      <NextShowcaseDialog
        open={nextOpen}
        onOpenChange={setNextOpen}
        pending={next.isPending}
        onConfirm={() => next.mutate({ params: { path: { slug: orgSlug } } })}
      />
    </>
  );

  return {
    current,
    totals,
    showcase,
    bibs,
    total,
    more,
    isPublished,
    earlier,
    primaryAction,
    dialogs,
  };
}
