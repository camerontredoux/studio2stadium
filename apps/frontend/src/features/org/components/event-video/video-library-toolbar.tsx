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
  const categoryItems = categories.map((c) => ({ value: c.id, label: c.name }));

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
        items={categoryItems}
        value={categoryFilter}
        onValueChange={(v) => onCategoryFilterChange(v as string | null)}
      >
        <SelectTrigger size="sm" className="min-w-none w-fit">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectPopup>
          {categoryItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
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
          className="lg:w-auto lg:px-3"
        >
          <XIcon className="size-3" />
          <span className="hidden lg:inline">Clear</span>
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
              className="lg:w-auto lg:gap-1.5 lg:px-3"
            >
              <SettingsIcon className="size-3.5 lg:size-3" />
              <span className="hidden lg:inline">Manage Categories</span>
            </Button>
          )}
          {onAddVideo && (
            <Button
              size="icon-sm"
              onClick={onAddVideo}
              title="Add Video"
              className="lg:w-auto lg:gap-1.5 lg:px-3"
            >
              <PlusIcon className="size-3.5 lg:size-3" />
              <span className="hidden lg:inline">Add Video</span>
            </Button>
          )}
        </>
      )}
    </div>
  );
}
