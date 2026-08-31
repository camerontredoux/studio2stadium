import { $api } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { Megaphone } from "lucide-react";
import { useOrg } from "@/features/org/context/use-org";
import type { MouseEvent } from "react";

export function CallbackButton({
  dancerRosterId,
  isCalledBack,
  eventId,
  onToggle,
}: {
  dancerRosterId: string;
  isCalledBack: boolean;
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
  const callbacksKey = scoutingQueries.callbacks(org.slug).queryKey;
  const dancersPrefix = ["get", "/orgs/{slug}/dancers"] as const;

  function setCalledBackInList(value: boolean) {
    qc.setQueriesData({ queryKey: [...dancersPrefix] }, (old: any) =>
      Array.isArray(old)
        ? old.map((d: any) =>
            d.rosterId === dancerRosterId ? { ...d, isCalledBack: value } : d,
          )
        : old,
    );
  }

  const add = $api.useMutation("post", "/orgs/{slug}/callbacks", {
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: dancerKey });
      await qc.cancelQueries({ queryKey: [...dancersPrefix] });
      await qc.cancelQueries({ queryKey: callbacksKey });
      const previousDancer = qc.getQueryData(dancerKey);
      qc.setQueryData(dancerKey, (old: any) => {
        if (!old) return old;
        return { ...old, isCalledBack: true };
      });
      setCalledBackInList(true);
      return { previousDancer };
    },
    onError: (_err, _variables, context: any) => {
      if (context?.previousDancer) {
        qc.setQueryData(dancerKey, context.previousDancer);
      }
      setCalledBackInList(false);
    },
    meta: {
      invalidateQueries: [
        callbacksKey,
        scoutingQueries.dancers(org.slug).queryKey,
      ],
    },
  });

  const remove = $api.useMutation(
    "delete",
    "/orgs/{slug}/callbacks/{dancerRosterId}",
    {
      onMutate: async () => {
        await qc.cancelQueries({ queryKey: dancerKey });
        await qc.cancelQueries({ queryKey: [...dancersPrefix] });
        await qc.cancelQueries({ queryKey: callbacksKey });
        const previousDancer = qc.getQueryData(dancerKey);
        qc.setQueryData(dancerKey, (old: any) => {
          if (!old) return old;
          return { ...old, isCalledBack: false };
        });
        setCalledBackInList(false);
        return { previousDancer };
      },
      onError: (_err, _variables, context: any) => {
        if (context?.previousDancer) {
          qc.setQueryData(dancerKey, context.previousDancer);
        }
        setCalledBackInList(true);
      },
      meta: {
        invalidateQueries: [
          callbacksKey,
          scoutingQueries.dancers(org.slug).queryKey,
        ],
      },
    },
  );

  const toggle = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.vibrate?.(10);
    onToggle?.(dancerRosterId, isCalledBack);
    if (isCalledBack) {
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
      className={`flex cursor-pointer items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
        isCalledBack
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:bg-muted border border-transparent hover:border-current"
      }`}
      aria-label={isCalledBack ? "Remove callback" : "Call back"}
      aria-pressed={isCalledBack}
    >
      <Megaphone className="mr-1 size-3.5" />
      {isCalledBack ? "Called Back" : "Call Back"}
    </button>
  );
}
