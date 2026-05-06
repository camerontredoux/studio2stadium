import type { RefObject } from "react";
import { Heart, PencilIcon, SchoolIcon, SearchIcon, StarIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const GPA_BUCKETS = [
  { label: "3.5+", value: "3.5" },
  { label: "3.0–3.5", value: "3.0" },
  { label: "2.5–3.0", value: "2.5" },
  { label: "< 2.5", value: "0" },
];

interface DancerFilterToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  yearFilter: number | null;
  onYearFilterChange: (value: number | null) => void;
  gpaFilter: string | null;
  onGpaFilterChange: (value: string | null) => void;
  stateFilter: string | null;
  onStateFilterChange: (value: string | null) => void;
  interested: boolean;
  onInterestedChange: (value: boolean) => void;
  favorited: boolean;
  onFavoritedChange: (value: boolean) => void;
  rated: boolean;
  onRatedChange: (value: boolean) => void;
  hasNotes: boolean;
  onHasNotesChange: (value: boolean) => void;
  schoolName: string | null;
  availableYears: number[];
  availableStates: string[];
  searchRef?: RefObject<HTMLInputElement | null>;
}

function IconToggle({
  pressed,
  onPressedChange,
  label,
  children,
}: {
  pressed: boolean;
  onPressedChange: (value: boolean) => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider delay={0}>
      <Tooltip>
        <TooltipTrigger
          render={
            <Toggle
              variant="outline"
              size="sm"
              pressed={pressed}
              onPressedChange={onPressedChange}
              aria-label={label}
            />
          }
        >
          {children}
        </TooltipTrigger>
        <TooltipPopup>{label}</TooltipPopup>
      </Tooltip>
    </TooltipProvider>
  );
}

export function DancerFilterToolbar({
  search,
  onSearchChange,
  yearFilter,
  onYearFilterChange,
  gpaFilter,
  onGpaFilterChange,
  stateFilter,
  onStateFilterChange,
  interested,
  onInterestedChange,
  favorited,
  onFavoritedChange,
  rated,
  onRatedChange,
  hasNotes,
  onHasNotesChange,
  schoolName,
  availableYears,
  availableStates,
  searchRef,
}: DancerFilterToolbarProps) {
  const hasActiveFilters =
    yearFilter !== null ||
    gpaFilter !== null ||
    stateFilter !== null ||
    interested ||
    favorited ||
    rated ||
    hasNotes;

  const clearAll = () => {
    onYearFilterChange(null);
    onGpaFilterChange(null);
    onStateFilterChange(null);
    onInterestedChange(false);
    onFavoritedChange(false);
    onRatedChange(false);
    onHasNotesChange(false);
  };

  return (
    <div className="border-border flex items-center gap-2 border-b px-3 py-2">
      {/* Search */}
      <InputGroup className="w-48 shrink-0">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          ref={searchRef}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search..."
          inputMode="search"
          data-size="sm"
        />
      </InputGroup>

      <div className="bg-border h-5 w-px shrink-0" />

      {/* Data filters */}
      <div className="flex items-center gap-1.5">
        <Select
          value={yearFilter}
          onValueChange={(v) => onYearFilterChange(v as number | null)}
        >
          <SelectTrigger size="sm" className="min-w-none w-fit">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectPopup>
            {availableYears.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>

        <Select
          value={gpaFilter}
          onValueChange={(v) => onGpaFilterChange(v as string | null)}
        >
          <SelectTrigger size="sm" className="min-w-none w-fit">
            <SelectValue placeholder="GPA" />
          </SelectTrigger>
          <SelectPopup>
            {GPA_BUCKETS.map((b) => (
              <SelectItem key={b.value} value={b.value}>
                {b.label}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>

        <Select
          value={stateFilter}
          onValueChange={(v) => onStateFilterChange(v as string | null)}
        >
          <SelectTrigger size="sm" className="min-w-none w-fit">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectPopup>
            {availableStates.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </div>

      <div className="bg-border h-5 w-px shrink-0" />

      {/* Scouting toggles */}
      <div className="flex items-center gap-1">
        {schoolName && (
          <IconToggle
            pressed={interested}
            onPressedChange={onInterestedChange}
            label={`Interested in ${schoolName}`}
          >
            <SchoolIcon className="size-3.5" />
          </IconToggle>
        )}

        <IconToggle
          pressed={favorited}
          onPressedChange={onFavoritedChange}
          label="Favorited"
        >
          <Heart className="size-3.5" />
        </IconToggle>

        <IconToggle
          pressed={rated}
          onPressedChange={onRatedChange}
          label="Rated"
        >
          <StarIcon className="size-3.5" />
        </IconToggle>

        <IconToggle
          pressed={hasNotes}
          onPressedChange={onHasNotesChange}
          label="Has notes"
        >
          <PencilIcon className="size-3.5" />
        </IconToggle>
      </div>

      {hasActiveFilters && (
        <>
          <div className="bg-border h-5 w-px shrink-0" />
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <XIcon className="size-3" />
            Clear
          </Button>
        </>
      )}
    </div>
  );
}
