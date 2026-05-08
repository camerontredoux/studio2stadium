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
    <div className="border-border flex items-center gap-2 border-b px-3 py-2">
      <InputGroup className="w-48 shrink-0">
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

      <div className="bg-border h-5 w-px shrink-0" />

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
        <>
          <div className="bg-border h-5 w-px shrink-0" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSearchChange("");
              onCategoryFilterChange(null);
            }}
          >
            <XIcon className="size-3" />
            Clear
          </Button>
        </>
      )}

      {(onManageCategories || onAddVideo) && (
        <>
          <div className="flex-1" />
          {onManageCategories && (
            <Button
              variant="outline"
              size="sm"
              onClick={onManageCategories}
              className="gap-1.5"
            >
              <SettingsIcon className="size-3" />
              Manage Categories
            </Button>
          )}
          {onAddVideo && (
            <Button size="sm" onClick={onAddVideo} className="gap-1.5">
              <PlusIcon className="size-3" />
              Add Video
            </Button>
          )}
        </>
      )}
    </div>
  );
}
