import {
  createFileRoute,
  Link,
  redirect,
  useParams,
} from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ExternalLinkIcon, SearchIcon, StarIcon, XIcon } from "lucide-react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { $api } from "@/lib/api/client";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { orgQueries } from "@/features/org/api/queries";
import { useOrg } from "@/features/org/context/use-org";
import { StatCell } from "@/features/org/components/dashboard-shared";
import { DancerTable } from "@/features/org/components/dancer-table/dancer-table";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toastManager } from "@/components/ui/toast-manager";
import { dancerEventSearchSchema } from "@/features/org/api/scouting-schemas";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/dancer/schools",
)({
  validateSearch: dancerEventSearchSchema,
  beforeLoad: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(
      orgQueries.org(params.orgSlug),
    );
    const features = (data.features ?? {}) as Record<string, boolean>;
    if (!features.school_selections) {
      throw redirect({ to: "/o/$orgSlug/dancer", params });
    }
  },
  component: SchoolsPage,
});

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SchoolRow {
  rosterId: string;
  organization: string | null;
  firstName: string;
  lastName: string;
  username: string | null;
  isTopSchool: boolean;
}

/* ------------------------------------------------------------------ */
/*  Columns                                                            */
/* ------------------------------------------------------------------ */

function schoolColumns(
  onToggle: (rosterId: string, current: boolean) => void,
  selectionCount: number,
  maxSelections: number,
): ColumnDef<SchoolRow>[] {
  return [
    {
      accessorKey: "organization",
      header: "School / Program",
      cell: ({ getValue }) => (
        <span className="truncate font-medium">
          {getValue<string | null>() ?? "—"}
        </span>
      ),
    },
    {
      id: "coachName",
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      header: "Head Coach",
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="truncate">{getValue<string>()}</span>
      ),
    },
    {
      id: "profile",
      header: "",
      size: 50,
      enableSorting: false,
      cell: ({ row }) => {
        const username = row.original.username;
        if (!username) return null;
        return (
          <Link
            to="/explore/$username"
            params={{ username }}
            className="text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
            onClick={(e) => e.stopPropagation()}
            aria-label={`View ${row.original.organization ?? "school"} profile`}
          >
            <ExternalLinkIcon className="size-3.5" />
          </Link>
        );
      },
    },
    {
      id: "topSchool",
      header: () => (
        <span title="Favorite School">
          <StarIcon className="text-muted-foreground size-4" />
        </span>
      ),
      size: 50,
      enableSorting: false,
      cell: ({ row }) => {
        const isTop = row.original.isTopSchool;
        const disabled =
          !isTop && maxSelections !== -1 && selectionCount >= maxSelections;
        return (
          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(row.original.rosterId, isTop);
            }}
            className="flex cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-30"
            aria-label={
              isTop
                ? `Remove from Top ${maxSelections === -1 ? "" : maxSelections}`
                : `Add to Top ${maxSelections === -1 ? "" : maxSelections}`
            }
          >
            <StarIcon
              className={`size-4 transition-colors ${
                isTop
                  ? "fill-amber-400 text-amber-500"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        );
      },
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

function SchoolsPage() {
  const { orgSlug } = useParams({
    from: "/_org/o/$orgSlug/_authenticated/dancer/schools",
  });
  const { eventId: searchEventId } = Route.useSearch();
  const { settings, myRosters } = useOrg();
  const eventId =
    searchEventId ??
    myRosters.find((roster) => roster.type === "dancer")?.eventId;
  const maxSelections = Number(settings?.max_school_selections) || 3;

  /* --- Filter state --- */
  const [search, setSearch] = useState("");
  const [topOnly, setTopOnly] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const searchRef = useRef<HTMLInputElement>(null);

  const [sorting, setSorting] = useState<SortingState>([
    { id: "organization", desc: false },
  ]);

  /* --- Data --- */
  const { data: schools, isLoading } = useQuery(
    scoutingQueries.schools(orgSlug, eventId),
  );
  const { data: selections } = useQuery(
    scoutingQueries.mySelections(orgSlug, eventId),
  );

  /* --- Mutations with optimistic updates --- */
  const qc = useQueryClient();
  const schoolsKey = scoutingQueries.schools(orgSlug, eventId).queryKey;
  const selectionsKey = scoutingQueries.mySelections(orgSlug, eventId).queryKey;

  const addSelection = $api.useMutation("post", "/orgs/{slug}/my-selections", {
    onMutate: async ({ body }) => {
      await qc.cancelQueries({ queryKey: schoolsKey });
      await qc.cancelQueries({ queryKey: selectionsKey });
      const prevSchools = qc.getQueryData(schoolsKey);
      const prevSelections = qc.getQueryData(selectionsKey);
      qc.setQueryData(schoolsKey, (old: any) =>
        Array.isArray(old)
          ? old.map((s: any) =>
              s.rosterId === body?.coachRosterId
                ? { ...s, isTopSchool: true }
                : s,
            )
          : old,
      );
      const school = (schools ?? []).find(
        (s: any) => s.rosterId === body?.coachRosterId,
      );
      if (school) {
        qc.setQueryData(selectionsKey, (old: any) =>
          Array.isArray(old)
            ? [
                ...old,
                {
                  id: `temp-${Date.now()}`,
                  coachRosterId: body?.coachRosterId,
                  organization: school.organization,
                  createdAt: new Date().toISOString(),
                },
              ]
            : old,
        );
      }
      return { prevSchools, prevSelections };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.prevSchools) qc.setQueryData(schoolsKey, ctx.prevSchools);
      if (ctx?.prevSelections)
        qc.setQueryData(selectionsKey, ctx.prevSelections);
      toastManager.add({
        title: "Couldn't add school to favorites",
        type: "error",
      });
    },
    meta: {
      invalidateQueries: [schoolsKey, selectionsKey],
    },
  });

  const removeSelection = $api.useMutation(
    "delete",
    "/orgs/{slug}/my-selections/{id}",
    {
      onMutate: async ({ params }) => {
        const selectionId = (params?.path as any)?.id;
        await qc.cancelQueries({ queryKey: schoolsKey });
        await qc.cancelQueries({ queryKey: selectionsKey });
        const prevSchools = qc.getQueryData(schoolsKey);
        const prevSelections = qc.getQueryData(selectionsKey);

        const selectionToRemove = (selections ?? []).find(
          (s: any) => s.id === selectionId,
        );
        if (selectionToRemove) {
          const coachRosterId = (selectionToRemove as any).coachRosterId;
          qc.setQueryData(schoolsKey, (old: any) =>
            Array.isArray(old)
              ? old.map((s: any) =>
                  s.rosterId === coachRosterId
                    ? { ...s, isTopSchool: false }
                    : s,
                )
              : old,
          );
          qc.setQueryData(selectionsKey, (old: any) =>
            Array.isArray(old)
              ? old.filter((s: any) => s.id !== selectionId)
              : old,
          );
        }
        return { prevSchools, prevSelections };
      },
      onError: (_err, _vars, ctx: any) => {
        if (ctx?.prevSchools) qc.setQueryData(schoolsKey, ctx.prevSchools);
        if (ctx?.prevSelections)
          qc.setQueryData(selectionsKey, ctx.prevSelections);
        toastManager.add({
          title: "Couldn't remove school from favorites",
          type: "error",
        });
      },
      meta: {
        invalidateQueries: [schoolsKey, selectionsKey],
      },
    },
  );

  const selectionCount = (selections ?? []).length;

  const handleToggle = useCallback(
    (coachRosterId: string, current: boolean) => {
      if (current) {
        const sel = (selections ?? []).find(
          (s: any) => s.coachRosterId === coachRosterId,
        );
        if (sel) {
          removeSelection.mutate({
            params: { path: { slug: orgSlug, id: (sel as any).id } },
          });
        }
      } else {
        if (maxSelections !== -1 && selectionCount >= maxSelections) {
          toastManager.add({
            title: `You can only select up to ${maxSelections} schools. Remove one first.`,
            type: "error",
          });
          return;
        }
        addSelection.mutate({
          params: { path: { slug: orgSlug } },
          body: { coachRosterId },
        });
      }
    },
    [
      orgSlug,
      selections,
      selectionCount,
      maxSelections,
      addSelection,
      removeSelection,
    ],
  );

  /* --- Derive isTopSchool from selections (works even before types are regenerated) --- */
  const selectedCoachIds = useMemo(
    () =>
      new Set((selections ?? []).map((selection) => selection.coachRosterId)),
    [selections],
  );

  /* --- Client-side filtering --- */
  const filteredData: SchoolRow[] = useMemo(() => {
    let result = (schools ?? []).map((s: any) => ({
      rosterId: s.rosterId as string,
      organization: s.organization as string | null,
      firstName: s.firstName as string,
      lastName: s.lastName as string,
      username: (s.username as string | null) ?? null,
      isTopSchool: selectedCoachIds.has(s.rosterId as string),
    }));

    if (topOnly) {
      result = result.filter((s) => s.isTopSchool);
    }

    return result;
  }, [schools, topOnly, selectedCoachIds]);

  const columns = useMemo(
    () => schoolColumns(handleToggle, selectionCount, maxSelections),
    [handleToggle, selectionCount, maxSelections],
  );

  /* --- Stats --- */
  const totalSchools = (schools ?? []).length;

  /* --- Keyboard shortcut --- */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    const isInput =
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      (e.target as HTMLElement)?.isContentEditable;
    if (e.key === "/" && !isInput) {
      e.preventDefault();
      searchRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-semibold tracking-tight 2xl:text-xl">
            Schools
          </h1>
          <span className="text-muted-foreground text-xs tabular-nums 2xl:text-sm">
            {totalSchools} attending
          </span>
        </div>
      </header>

      <section
        aria-label="School stats"
        className="border-border flex items-stretch border-y"
      >
        <StatCell label="Total Schools" value={totalSchools} accent="blue" />
        <StatCell
          label={
            maxSelections === -1 ? "My Selections" : `My Top ${maxSelections}`
          }
          value={
            maxSelections === -1
              ? selectionCount
              : `${selectionCount} / ${maxSelections}`
          }
          accent={
            maxSelections !== -1 && selectionCount >= maxSelections
              ? "amber"
              : "green"
          }
        />
      </section>

      {/* Filter toolbar */}
      <div className="border-border flex items-center gap-2 border-b px-3 py-2">
        <InputGroup className="w-48 shrink-0">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            inputMode="search"
            data-size="sm"
          />
        </InputGroup>

        <div className="bg-border h-5 w-px shrink-0" />

        <TooltipProvider delay={0}>
          <Tooltip>
            <TooltipTrigger
              render={
                <Toggle
                  variant="outline"
                  size="sm"
                  pressed={topOnly}
                  onPressedChange={setTopOnly}
                  aria-label="My Favorites"
                />
              }
            >
              <StarIcon className="size-3.5" />
            </TooltipTrigger>
            <TooltipPopup>My Favorites</TooltipPopup>
          </Tooltip>
        </TooltipProvider>

        {(topOnly || search) && (
          <>
            <div className="bg-border h-5 w-px shrink-0" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTopOnly(false);
                setSearch("");
              }}
            >
              <XIcon className="size-3" />
              Clear
            </Button>
          </>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <DancerTable<SchoolRow>
          data={filteredData}
          columns={columns}
          isLoading={isLoading}
          globalFilter={deferredSearch}
          emptyState={
            <p className="text-muted-foreground text-sm">
              {deferredSearch
                ? `No schools matched "${deferredSearch}".`
                : topOnly
                  ? "You haven't selected any favorite schools yet."
                  : "No schools registered for this event yet."}
            </p>
          }
          renderCard={(row) => (
            <SchoolCard
              school={row}
              selectionCount={selectionCount}
              maxSelections={maxSelections}
              onToggle={handleToggle}
            />
          )}
          sorting={sorting}
          onSortingChange={setSorting}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile Card                                                        */
/* ------------------------------------------------------------------ */

function SchoolCard({
  school,
  selectionCount,
  maxSelections,
  onToggle,
}: {
  school: SchoolRow;
  selectionCount: number;
  maxSelections: number;
  onToggle: (rosterId: string, current: boolean) => void;
}) {
  const disabled =
    !school.isTopSchool &&
    maxSelections !== -1 &&
    selectionCount >= maxSelections;
  return (
    <div className="bg-card flex w-full items-center justify-between gap-3 rounded-lg border p-3">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate font-medium">
          {school.organization ?? "—"}
        </span>
        <span className="text-muted-foreground flex items-center gap-2 truncate text-sm">
          {school.firstName} {school.lastName}
          {school.username && (
            <Link
              to="/explore/$username"
              params={{ username: school.username }}
              className="text-muted-foreground hover:text-foreground"
              aria-label="View profile"
            >
              <ExternalLinkIcon className="size-3" />
            </Link>
          )}
        </span>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onToggle(school.rosterId, school.isTopSchool)}
        className="flex shrink-0 cursor-pointer items-center justify-center p-1 disabled:cursor-not-allowed disabled:opacity-30"
        aria-label={
          school.isTopSchool ? "Remove from favorites" : "Add to favorites"
        }
      >
        <StarIcon
          className={`size-5 transition-colors ${
            school.isTopSchool
              ? "fill-amber-400 text-amber-500"
              : "text-muted-foreground"
          }`}
        />
      </button>
    </div>
  );
}
