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
import { PlusIcon, SearchIcon, SettingsIcon, XIcon } from "lucide-react";
import type { VideoCategory } from "@/features/org/api/video-queries";

interface VideoLibraryToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string | null;
  onCategoryFilterChange: (value: string | null) => void;
  categories: VideoCategory[];
  onManageCategories?: () => void;
  onAddVideo?: () => void;
}

export function VideoLibraryToolbar({
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  categories,
  onManageCategories,
  onAddVideo,
}: VideoLibraryToolbarProps) {
  const hasActiveFilters = search.length > 0 || categoryFilter !== null;

  return (
    <div className="border-border flex flex-wrap items-center gap-2 border-b px-3 py-2">
      <InputGroup className="w-40 shrink-0 sm:w-48">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search videos..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          data-size="sm"
          inputMode="search"
        />
      </InputGroup>

      <div className="bg-border hidden h-5 w-px shrink-0 sm:block" />

      <Select
        value={categoryFilter}
        onValueChange={(v) => onCategoryFilterChange(v as string | null)}
      >
        <SelectTrigger size="sm" className="min-w-none w-fit">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectPopup>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            onSearchChange("");
            onCategoryFilterChange(null);
          }}
          title="Clear filters"
          className="sm:w-auto sm:px-3"
        >
          <XIcon className="size-3" />
          <span className="hidden sm:inline">Clear</span>
        </Button>
      )}

      {(onManageCategories || onAddVideo) && (
        <>
          <div className="flex-1" />
          {onManageCategories && (
            <Button
              variant="outline"
              size="icon-sm"
              onClick={onManageCategories}
              title="Manage Categories"
              className="sm:w-auto sm:gap-1.5 sm:px-3"
            >
              <SettingsIcon className="size-3.5 sm:size-3" />
              <span className="hidden sm:inline">Manage Categories</span>
            </Button>
          )}
          {onAddVideo && (
            <Button
              size="icon-sm"
              onClick={onAddVideo}
              title="Add Video"
              className="sm:w-auto sm:gap-1.5 sm:px-3"
            >
              <PlusIcon className="size-3.5 sm:size-3" />
              <span className="hidden sm:inline">Add Video</span>
            </Button>
          )}
        </>
      )}
    </div>
  );
}
