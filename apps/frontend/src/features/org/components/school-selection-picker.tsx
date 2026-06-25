import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Frame,
  FramePanel,
  FrameHeader,
  FrameTitle,
} from "@/components/ui/frame";
import { toastManager } from "@/components/ui/toast-manager";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import {
  useAddSchoolSelection,
  useRemoveSchoolSelection,
} from "@/features/org/api/scouting-mutations";
import { useOrg } from "@/features/org/context/use-org";
import { CheckIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react";

export function SchoolSelectionPicker() {
  const { org, settings } = useOrg();
  const maxSelections = Number(settings?.max_school_selections) || 3;
  const [search, setSearch] = useState("");

  const { data: schools } = useQuery(
    scoutingQueries.schools(org.slug),
  );
  const { data: selections } = useQuery(
    scoutingQueries.mySelections(org.slug),
  );

  const addSelection = useAddSchoolSelection(org.slug);
  const removeSelection = useRemoveSchoolSelection(org.slug);

  const selectedIds = new Set(
    (selections ?? []).map((s) => s.coachRosterId),
  );

  const filteredSchools = (schools ?? []).filter((s) =>
    (s.organization ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleAdd = async (coachRosterId: string) => {
    if (maxSelections !== -1 && (selections ?? []).length >= maxSelections) {
      toastManager.add({
        title: "Remove one to add another.",
        description: `You can only select up to ${maxSelections} schools.`,
        type: "error",
      });
      return;
    }
    await addSelection.mutateAsync({
      params: { path: { slug: org.slug } },
      body: { coachRosterId },
    });
  };

  const handleRemove = async (selectionId: string) => {
    await removeSelection.mutateAsync({
      params: { path: { slug: org.slug, id: selectionId } },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">
          {maxSelections === -1 ? "My Top Schools" : `My Top ${maxSelections} Schools`}
        </h1>
        <p className="text-muted-foreground text-sm">
          {maxSelections === -1
            ? "Select the programs you're interested in. Your selections are completely private."
            : `Select up to ${maxSelections} programs you're interested in. Your selections are completely private.`}
        </p>
      </div>

      {/* Selected schools */}
      <Frame>
        <FrameHeader>
          <FrameTitle>
            Selected ({(selections ?? []).length}{maxSelections === -1 ? "" : ` of ${maxSelections}`})
          </FrameTitle>
        </FrameHeader>
        <FramePanel>
          <div className="flex flex-wrap gap-2">
            {(selections ?? []).map((s) => (
              <div
                key={s.id}
                className="bg-muted flex items-center gap-1.5 rounded-full py-1 pr-1 pl-3 text-sm font-medium"
              >
                {s.organization}
                <button
                  type="button"
                  onClick={() => handleRemove(s.id)}
                  className="hover:bg-muted-foreground/20 rounded-full p-0.5"
                  aria-label={`Remove ${s.organization}`}
                >
                  <XIcon className="size-3.5" />
                </button>
              </div>
            ))}
            {(maxSelections === -1 || (selections ?? []).length < maxSelections) && (
              <span className="text-muted-foreground flex items-center text-sm">
                {maxSelections === -1
                  ? "Add more schools"
                  : `+ ${maxSelections - (selections ?? []).length} slot${maxSelections - (selections ?? []).length !== 1 ? "s" : ""} remaining`}
              </span>
            )}
          </div>
        </FramePanel>
      </Frame>

      {/* Search + list */}
      <Frame>
        <FrameHeader>
          <FrameTitle>All Programs</FrameTitle>
        </FrameHeader>
        <FramePanel>
          <div className="flex flex-col gap-3">
            <div className="relative">
              <SearchIcon className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search programs..."
                className="h-10 pl-9"
              />
            </div>
            <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
              {filteredSchools.map((school) => {
                const isSelected = selectedIds.has(school.rosterId);
                return (
                  <div
                    key={school.rosterId}
                    className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent/50"
                  >
                    <span className="text-sm">
                      {school.organization ?? "Unknown"}
                    </span>
                    {isSelected ? (
                      <span className="text-muted-foreground flex items-center gap-1 text-sm">
                        <CheckIcon className="size-4" />
                        Added
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() => handleAdd(school.rosterId)}
                        disabled={maxSelections !== -1 && (selections ?? []).length >= maxSelections}
                      >
                        <PlusIcon className="mr-1 size-3.5" />
                        Add
                      </Button>
                    )}
                  </div>
                );
              })}
              {filteredSchools.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No programs found.
                </p>
              )}
            </div>
          </div>
        </FramePanel>
      </Frame>
    </div>
  );
}
