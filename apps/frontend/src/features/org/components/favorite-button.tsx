import { $api } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { Heart } from "lucide-react";
import { useOrg } from "@/features/org/context/use-org";
import type { MouseEvent } from "react";

export function FavoriteButton({
  dancerRosterId,
  isFavorited,
  eventId,
  onToggle,
}: {
  dancerRosterId: string;
  isFavorited: boolean;
  /** Must match the event the surrounding view reads, or the optimistic
   *  update lands on a cache entry nothing is rendering. */
  eventId?: string;
  onToggle?: (rosterId: string, current: boolean) => void;
}) {
  const { org } = useOrg();
  const qc = useQueryClient();
  const dancerKey = scoutingQueries.dancer(
    org.slug,
    dancerRosterId,
    eventId,
  ).queryKey;
  const favKey = scoutingQueries.favorites(org.slug, eventId).queryKey;

  const dancersPrefix = ["get", "/orgs/{slug}/dancers"] as const;

  function setFavoritedInList(value: boolean) {
    qc.setQueriesData({ queryKey: [...dancersPrefix] }, (old: any) =>
      Array.isArray(old)
        ? old.map((d: any) =>
            d.rosterId === dancerRosterId ? { ...d, isFavorited: value } : d,
          )
        : old,
    );
  }

  const add = $api.useMutation("post", "/orgs/{slug}/favorites", {
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: dancerKey });
      await qc.cancelQueries({ queryKey: [...dancersPrefix] });
      await qc.cancelQueries({ queryKey: favKey });
      const previousDancer = qc.getQueryData(dancerKey);
      const previousFavs = qc.getQueryData(favKey);
      qc.setQueryData(dancerKey, (old: any) => {
        if (!old) return old;
        return { ...old, isFavorited: true };
      });
      setFavoritedInList(true);
      qc.setQueryData(favKey, (old: any) => {
        if (!Array.isArray(old)) return old;
        const dancer = qc.getQueryData(dancerKey) as any;
        if (!dancer) return old;
        return [...old, { rosterId: dancerRosterId, bibNumber: dancer.bibNumber, firstName: dancer.firstName, lastName: dancer.lastName, profilePhotoUrl: dancer.profilePhotoUrl, gradYear: dancer.gradYear, studio: dancer.studio, state: dancer.state, gpa: dancer.gpa }];
      });
      return { previousDancer, previousFavs };
    },
    onError: (_err, _variables, context: any) => {
      if (context?.previousDancer) {
        qc.setQueryData(dancerKey, context.previousDancer);
      }
      if (context?.previousFavs) {
        qc.setQueryData(favKey, context.previousFavs);
      }
      setFavoritedInList(false);
    },
    meta: {
      invalidateQueries: [
        favKey,
        scoutingQueries.dancers(org.slug).queryKey,
        scoutingQueries.rankings(org.slug).queryKey,
      ],
    },
  });

  const remove = $api.useMutation(
    "delete",
    "/orgs/{slug}/favorites/{dancerRosterId}",
    {
      onMutate: async () => {
        await qc.cancelQueries({ queryKey: dancerKey });
        await qc.cancelQueries({ queryKey: [...dancersPrefix] });
        await qc.cancelQueries({ queryKey: favKey });
        const previousDancer = qc.getQueryData(dancerKey);
        const previousFavs = qc.getQueryData(favKey);
        qc.setQueryData(dancerKey, (old: any) => {
          if (!old) return old;
          return { ...old, isFavorited: false };
        });
        setFavoritedInList(false);
        qc.setQueryData(favKey, (old: any) =>
          Array.isArray(old) ? old.filter((d: any) => d.rosterId !== dancerRosterId) : old,
        );
        return { previousDancer, previousFavs };
      },
      onError: (_err, _variables, context: any) => {
        if (context?.previousDancer) {
          qc.setQueryData(dancerKey, context.previousDancer);
        }
        if (context?.previousFavs) {
          qc.setQueryData(favKey, context.previousFavs);
        }
        setFavoritedInList(true);
      },
      meta: {
        invalidateQueries: [
          favKey,
          scoutingQueries.dancers(org.slug).queryKey,
          scoutingQueries.rankings(org.slug).queryKey,
        ],
      },
    },
  );

  const toggle = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.vibrate?.(10);
    onToggle?.(dancerRosterId, isFavorited);
    if (isFavorited) {
      remove.mutate({
        params: { path: { slug: org.slug, dancerRosterId } },
      });
    } else {
      add.mutate({
        params: { path: { slug: org.slug } },
        body: { dancerRosterId },
      });
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="cursor-pointer"
      aria-label={isFavorited ? "Unfavorite" : "Favorite"}
      aria-pressed={isFavorited}
    >
      <Heart
        className={`size-5 transition-colors ${isFavorited ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-500"}`}
      />
    </button>
  );
}
