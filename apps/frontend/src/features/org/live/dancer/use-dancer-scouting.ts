import {
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { useRef } from "react";

import { toastManager } from "@/components/ui/toast-manager";
import type { OrgEvent } from "@/features/org/api/admin-queries";
import {
  useAddSchoolSelection,
  useMoveSchoolSelection,
  useRemoveSchoolSelection,
} from "@/features/org/api/scouting-mutations";
import {
  SCHOOL_PAGES_KEY_PREFIX,
  scoutingQueries,
} from "@/features/org/api/scouting-queries";
import type { MyRoster } from "@/features/org/context/org-context";
import { useOrg } from "@/features/org/context/use-org";

import {
  maxSchoolSelections,
  schoolLabel,
  selectionsFull,
  type DancerCallback,
  type School,
  type SchoolSelection,
} from "./dancer-scouting";

const TEMP_PREFIX = "temp-";

export type MoveDirection = "up" | "down";

type SchoolPages = InfiniteData<{ data: School[]; total: number }, number>;

/** Ranks follow list order, 1 first, as the API keeps them. */
function reRank(list: SchoolSelection[]): SchoolSelection[] {
  return list.map((selection, index) => ({ ...selection, rank: index + 1 }));
}

/** The list with `id` swapped with its neighbour, or null at either end. */
export function moveSelection(
  list: readonly SchoolSelection[],
  id: string,
  direction: MoveDirection,
): SchoolSelection[] | null {
  const from = list.findIndex((selection) => selection.id === id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= list.length) return null;
  const next = [...list];
  [next[from], next[to]] = [next[to]!, next[from]!];
  return reRank(next);
}

export function isPendingSelection(selection: SchoolSelection): boolean {
  return selection.id.startsWith(TEMP_PREFIX);
}

/**
 * The dancer's schools, top-choice selections and callbacks for one Org Event,
 * with optimistic add and remove. Shared by the dashboard widgets and the
 * Coaches page so both read the same cache.
 *
 * `allSchools: false` skips the full schools list: the dashboard's Top choices
 * widget reads its schools a page at a time (`scoutingQueries.schoolPages`).
 */
export function useDancerScouting(
  event: OrgEvent | null,
  roster: MyRoster | null,
  { allSchools = true }: { allSchools?: boolean } = {},
) {
  const { org, settings, hasFeature } = useOrg();
  const slug = org.slug;
  const eventId = event?.id;
  const selectionsOn = hasFeature("school_selections");
  const callbacksOn = hasFeature("callbacks");
  const max = maxSchoolSelections(settings);
  const qc = useQueryClient();

  const schoolsOptions = scoutingQueries.schools(slug, eventId);
  const schoolPagesKey = [...SCHOOL_PAGES_KEY_PREFIX];
  const selectionsOptions = scoutingQueries.mySelections(slug, eventId);

  const schoolsQuery = useQuery({
    ...schoolsOptions,
    enabled: !!event && allSchools,
    retry: false,
  });
  const selectionsQuery = useQuery({
    ...selectionsOptions,
    enabled: !!event && selectionsOn,
  });
  const callbacksQuery = useQuery({
    ...scoutingQueries.dancerCallbacks(slug, eventId),
    enabled: !!event && callbacksOn,
  });

  const schools: School[] = schoolsQuery.data ?? [];
  const selections: SchoolSelection[] = selectionsOn
    ? (selectionsQuery.data ?? [])
    : [];
  const callbacks: DancerCallback[] = callbacksOn
    ? (callbacksQuery.data?.callbacks ?? [])
    : [];
  const callbacksReleased =
    (callbacksQuery.data?.publishedShowcaseCount ?? 0) > 0;

  // Selections are written to the org's active Org Event (the backend ignores
  // any eventId on writes), so only that event's choices can change, and only
  // by a dancer on its roster.
  const canEdit = selectionsOn && !!roster && !!event?.isActive;
  const full = selectionsFull(selections.length, max);

  const addMutation = useAddSchoolSelection(slug);
  const removeMutation = useRemoveSchoolSelection(slug);
  const moveMutation = useMoveSchoolSelection();

  // Moves and removals run one at a time, in click order: a move names a
  // neighbour by position, so it has to reach the server after the writes
  // that came before it. Once the queue drains, refetch the server's order.
  const queue = useRef<Promise<void>>(Promise.resolve());
  const queued = useRef(0);
  const enqueue = (run: () => Promise<void>) => {
    queued.current += 1;
    queue.current = queue.current.then(run).finally(() => {
      queued.current -= 1;
      if (queued.current === 0) {
        void qc.invalidateQueries({ queryKey: selectionsOptions.queryKey });
      }
    });
  };

  const snapshot = () => ({
    schools: qc.getQueryData<School[]>(schoolsOptions.queryKey),
    schoolPages: qc.getQueriesData<SchoolPages>({ queryKey: schoolPagesKey }),
    selections: qc.getQueryData<SchoolSelection[]>(selectionsOptions.queryKey),
  });
  const restore = (prev: ReturnType<typeof snapshot>) => {
    if (prev.schools) qc.setQueryData(schoolsOptions.queryKey, prev.schools);
    for (const [key, pages] of prev.schoolPages) qc.setQueryData(key, pages);
    if (prev.selections)
      qc.setQueryData(selectionsOptions.queryKey, prev.selections);
  };
  const mark = (school: School, rosterId: string, isTopSchool: boolean) =>
    school.rosterId === rosterId ? { ...school, isTopSchool } : school;
  const markTop = (rosterId: string, isTopSchool: boolean) => {
    qc.setQueryData<School[]>(schoolsOptions.queryKey, (old) =>
      old?.map((school) => mark(school, rosterId, isTopSchool)),
    );
    qc.setQueriesData<SchoolPages>({ queryKey: schoolPagesKey }, (old) =>
      old
        ? {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((school) =>
                mark(school, rosterId, isTopSchool),
              ),
            })),
          }
        : old,
    );
  };
  // The full list refetches; the pages keep the patch above until they next
  // load, rather than refetching every page loaded so far.
  const refreshSchools = () => {
    void qc.invalidateQueries({ queryKey: schoolsOptions.queryKey });
    void qc.invalidateQueries({
      queryKey: schoolPagesKey,
      refetchType: "none",
    });
  };

  const add = (school: School) => {
    if (!canEdit) return;
    if (selections.some((s) => s.coachRosterId === school.rosterId)) return;
    if (full) {
      toastManager.add({
        title: `You can pick up to ${max} schools. Remove one first.`,
        type: "error",
      });
      return;
    }
    const prev = snapshot();
    const tempId = `${TEMP_PREFIX}${school.rosterId}`;
    void qc.cancelQueries({ queryKey: selectionsOptions.queryKey });
    qc.setQueryData<SchoolSelection[]>(selectionsOptions.queryKey, (old) =>
      old
        ? [
            ...old,
            {
              id: tempId,
              coachRosterId: school.rosterId,
              organization: school.organization,
              firstName: school.firstName,
              lastName: school.lastName,
              rank: old.length + 1,
              createdAt: new Date().toISOString(),
            },
          ]
        : old,
    );
    markTop(school.rosterId, true);
    addMutation.mutate(
      { params: { path: { slug } }, body: { coachRosterId: school.rosterId } },
      {
        onError: () => {
          restore(prev);
          toastManager.add({
            title: `Couldn't add ${schoolLabel(school.organization)}`,
            type: "error",
          });
        },
        // Swap the placeholder for the saved row so it can be moved or
        // removed straight away, without waiting for a refetch.
        onSuccess: (saved) =>
          qc.setQueryData<SchoolSelection[]>(
            selectionsOptions.queryKey,
            (old) =>
              old?.map((s) =>
                s.id === tempId
                  ? { ...s, id: saved.id, createdAt: saved.createdAt }
                  : s,
              ),
          ),
        onSettled: () => {
          refreshSchools();
          if (queued.current === 0) {
            void qc.invalidateQueries({
              queryKey: selectionsOptions.queryKey,
            });
          }
        },
      },
    );
  };

  const remove = (selection: SchoolSelection) => {
    if (!canEdit || isPendingSelection(selection)) return;
    const prev = snapshot();
    void qc.cancelQueries({ queryKey: selectionsOptions.queryKey });
    qc.setQueryData<SchoolSelection[]>(selectionsOptions.queryKey, (old) =>
      old ? reRank(old.filter((s) => s.id !== selection.id)) : old,
    );
    markTop(selection.coachRosterId, false);
    enqueue(async () => {
      try {
        await removeMutation.mutateAsync({
          params: { path: { slug, id: selection.id } },
        });
      } catch {
        restore(prev);
        toastManager.add({
          title: `Couldn't remove ${schoolLabel(selection.organization)}`,
          type: "error",
        });
      } finally {
        refreshSchools();
      }
    });
  };

  /** Swaps a top choice with the one above or below it. */
  const move = (selection: SchoolSelection, direction: MoveDirection) => {
    if (!canEdit || isPendingSelection(selection)) return;
    const current = qc.getQueryData<SchoolSelection[]>(
      selectionsOptions.queryKey,
    );
    const next = current && moveSelection(current, selection.id, direction);
    if (!next) return;
    const prev = snapshot();
    void qc.cancelQueries({ queryKey: selectionsOptions.queryKey });
    qc.setQueryData<SchoolSelection[]>(selectionsOptions.queryKey, next);
    enqueue(async () => {
      try {
        await moveMutation.mutateAsync({
          params: { path: { slug, id: selection.id } },
          body: { direction },
        });
      } catch {
        restore(prev);
        toastManager.add({
          title: `Couldn't move ${schoolLabel(selection.organization)}`,
          type: "error",
        });
      }
    });
  };

  return {
    slug,
    eventId,
    schools,
    selections,
    callbacks,
    callbacksReleased,
    max,
    full,
    canEdit,
    selectionsOn,
    callbacksOn,
    schoolsQuery,
    selectionsQuery,
    callbacksQuery,
    add,
    remove,
    move,
  };
}

export type DancerScouting = ReturnType<typeof useDancerScouting>;
