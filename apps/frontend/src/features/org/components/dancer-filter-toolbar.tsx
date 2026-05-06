import { SearchIcon, XIcon } from "lucide-react";
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
  schoolName: string | null;
  availableYears: number[];
  availableStates: string[];
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
  schoolName,
  availableYears,
  availableStates,
}: DancerFilterToolbarProps) {
  const hasActiveFilters =
    yearFilter !== null ||
    gpaFilter !== null ||
    stateFilter !== null ||
    interested;

  const clearAll = () => {
    onYearFilterChange(null);
    onGpaFilterChange(null);
    onStateFilterChange(null);
    onInterestedChange(false);
  };

  return (
    <div className="border-border bg-muted/40 flex flex-wrap items-center gap-2 border-b px-3 py-2">
      <InputGroup className="w-full sm:w-60">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name or bib #..."
          inputMode="search"
          data-size="sm"
        />
      </InputGroup>

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

      {schoolName && (
        <Toggle
          variant="outline"
          size="sm"
          pressed={interested}
          onPressedChange={onInterestedChange}
        >
          Interested in {schoolName}
        </Toggle>
      )}

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll}>
          <XIcon className="size-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
