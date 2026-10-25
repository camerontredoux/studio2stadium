import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { toastManager } from "@/components/ui/toast-manager";
import {
  patchScoutedDancer,
  restoreScoutingCaches,
  useAddCallback,
  useAddFavorite,
  useRemoveCallback,
  useRemoveFavorite,
} from "@/features/org/api/scouting-mutations";
import { useOrg } from "@/features/org/context/use-org";
import { $api, type ApiSchemas } from "@/lib/api/client";

export type ScoutedDancer = ApiSchemas["OrgsIdDancersResponse"][number];
type DancerDetail = ApiSchemas["OrgsIdDancersIdResponse"];

/**
 * The rating API's validator takes 1 to 5 and its controller also rejects
 * anything above the org's `rating_scale_max` (default 10), so the scale a
 * coach sees is the smaller of the two. Clicking the current score clears the
 * rating through the DELETE route.
 */
const RATING_API_MAX = 5;

export function resolveRatingMax(settings: Record<string, unknown>) {
  const raw = Number(settings.rating_scale_max ?? 10);
  if (!Number.isFinite(raw) || raw < 1) return RATING_API_MAX;
  return Math.min(RATING_API_MAX, Math.floor(raw));
}

export function dancerName(dancer: {
  firstName?: string | null;
  lastName?: string | null;
}) {
  return `${dancer.firstName ?? ""} ${dancer.lastName ?? ""}`.trim();
}

/** The API's `{ message }` on a 409/422, for the error toast's description. */
function errorMessage(error: unknown) {
  return typeof error === "object" && error && "message" in error
    ? String((error as { message: unknown }).message)
    : undefined;
}

type RatingContext = {
  snapshot: Awaited<ReturnType<typeof patchScoutedDancer>>;
};

const dancerDetailKey = ["get", "/orgs/{slug}/dancers/{rosterId}"] as const;

/**
 * Who may scout what, and the coach's writes (favorite, callback, rating,
 * note), each patching every cached dancer list, detail and ranking at once.
 * A coach scouts only during her own event: her Roster Entry is active and
 * started, and the dancer is on that event.
 */
export function useCoachScouting() {
  const { org, myRoster, hasFeature, settings } = useOrg();
  const qc = useQueryClient();
  const slug = org.slug;
  const callbacksEnabled = hasFeature("callbacks");
  const ratingMax = resolveRatingMax(settings);
  const canScout = Boolean(myRoster?.isActive && myRoster.hasStarted);
  const scoutEventId = canScout ? myRoster?.eventId : undefined;

  const canScoutDancer = useCallback(
    (dancer: { eventId?: string | null }) =>
      scoutEventId !== undefined && dancer.eventId === scoutEventId,
    [scoutEventId],
  );

  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const addCallback = useAddCallback();
  const removeCallback = useRemoveCallback();

  const rating = $api.useMutation(
    "put",
    "/orgs/{slug}/dancers/{dancerRosterId}/rating",
    {
      onMutate: async ({ params, body }): Promise<RatingContext> => ({
        snapshot: await patchScoutedDancer(qc, params.path.dancerRosterId, {
          rating: Number(body?.rating),
        }),
      }),
      onError: (error, _variables, context) => {
        restoreScoutingCaches(
          qc,
          (context as RatingContext | undefined)?.snapshot,
        );
        toastManager.add({
          title: "Couldn't save rating",
          description: errorMessage(error),
          type: "error",
        });
      },
      meta: {
        invalidateQueries: [
          ["get", "/orgs/{slug}/dancers"],
          ["get", "/orgs/{slug}/dancers/{rosterId}"],
          ["get", "/orgs/{slug}/rankings"],
        ],
      },
    },
  );

  const clearRating = $api.useMutation(
    "delete",
    "/orgs/{slug}/dancers/{dancerRosterId}/rating",
    {
      onMutate: async ({ params }): Promise<RatingContext> => ({
        snapshot: await patchScoutedDancer(qc, params.path.dancerRosterId, {
          rating: null,
        }),
      }),
      onError: (error, _variables, context) => {
        restoreScoutingCaches(
          qc,
          (context as RatingContext | undefined)?.snapshot,
        );
        toastManager.add({
          title: "Couldn't clear rating",
          description: errorMessage(error),
          type: "error",
        });
      },
      meta: {
        invalidateQueries: [
          ["get", "/orgs/{slug}/dancers"],
          ["get", "/orgs/{slug}/dancers/{rosterId}"],
          ["get", "/orgs/{slug}/rankings"],
        ],
      },
    },
  );

  const upsertNote = $api.useMutation(
    "put",
    "/orgs/{slug}/dancers/{dancerRosterId}/notes",
  );
  const deleteNote = $api.useMutation(
    "delete",
    "/orgs/{slug}/dancers/{dancerRosterId}/notes",
  );

  const toggleFavorite = useCallback(
    (dancer: { rosterId: string; isFavorited: boolean }) => {
      if (dancer.isFavorited) {
        return removeFavorite.mutateAsync({
          params: { path: { slug, dancerRosterId: dancer.rosterId } },
        });
      }
      return addFavorite.mutateAsync({
        params: { path: { slug } },
        body: { dancerRosterId: dancer.rosterId },
      });
    },
    [slug, addFavorite, removeFavorite],
  );

  const toggleCallback = useCallback(
    (dancer: { rosterId: string; isCalledBack: boolean }) => {
      if (dancer.isCalledBack) {
        return removeCallback.mutateAsync({
          params: { path: { slug, dancerRosterId: dancer.rosterId } },
        });
      }
      return addCallback.mutateAsync({
        params: { path: { slug } },
        body: { dancerRosterId: dancer.rosterId },
      });
    },
    [slug, addCallback, removeCallback],
  );

  const rate = useCallback(
    (rosterId: string, value: number) => {
      const path = { slug, dancerRosterId: rosterId };
      // The Rating control reports 0 when the coach clicks the current score.
      if (value === 0) {
        clearRating.mutate({ params: { path } });
        return;
      }
      if (value < 1 || value > ratingMax) return;
      rating.mutate({ params: { path }, body: { rating: value } });
    },
    [slug, rating, clearRating, ratingMax],
  );

  /** Saves the note (an empty one deletes it). Resolves true when it saved. */
  const saveNote = useCallback(
    async (rosterId: string, content: string) => {
      const trimmed = content.trim();
      const path = { slug, dancerRosterId: rosterId };
      try {
        if (trimmed === "") {
          await deleteNote.mutateAsync({ params: { path } });
        } else {
          await upsertNote.mutateAsync({ params: { path }, body: { content } });
        }
      } catch (error) {
        toastManager.add({
          title: "Couldn't save note",
          description: errorMessage(error),
          type: "error",
        });
        return false;
      }
      await patchScoutedDancer(qc, rosterId, { hasNote: trimmed !== "" });
      qc.setQueriesData<DancerDetail>({ queryKey: dancerDetailKey }, (old) =>
        old && !Array.isArray(old) && old.rosterId === rosterId
          ? { ...old, note: trimmed === "" ? null : content }
          : old,
      );
      void qc.invalidateQueries({ queryKey: ["get", "/orgs/{slug}/rankings"] });
      return true;
    },
    [slug, qc, upsertNote, deleteNote],
  );

  return {
    slug,
    callbacksEnabled,
    ratingMax,
    canScout,
    canScoutDancer,
    toggleFavorite,
    toggleCallback,
    rate,
    saveNote,
    savingNote: upsertNote.isPending || deleteNote.isPending,
  };
}
