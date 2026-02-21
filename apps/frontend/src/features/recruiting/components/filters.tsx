import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FiltersProps {
  status: string;
  watched: string;
  onStatusChange: (value: string) => void;
  onWatchedChange: (value: string) => void;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "accepted", label: "Accepted" },
  { value: "in_review", label: "In Review" },
  { value: "released", label: "Released" },
  { value: "pending", label: "Pending" },
];

const WATCHED_OPTIONS = [
  { value: "all", label: "All" },
  { value: "watched", label: "Watched" },
  { value: "not_watched", label: "Not Watched" },
];

export function Filters({
  status,
  watched,
  onStatusChange,
  onWatchedChange,
}: FiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Status</Label>
        <Select
          items={STATUS_OPTIONS}
          value={status}
          onValueChange={(value) => value && onStatusChange(value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Watched</Label>
        <Select
          items={WATCHED_OPTIONS}
          value={watched}
          onValueChange={(value) => value && onWatchedChange(value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WATCHED_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
