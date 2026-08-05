import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/components/utils/cn";
import type { SchoolSubmission } from "../../types";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_review", label: "In Review" },
  { value: "accepted", label: "Accepted" },
  { value: "released", label: "Released" },
] as const;

interface SubmissionStatusSelectProps {
  value: SchoolSubmission["status"];
  onValueChange: (status: SchoolSubmission["status"]) => void;
  pending?: boolean;
  className?: string;
}

export function SubmissionStatusSelect({
  value,
  onValueChange,
  pending,
  className,
}: SubmissionStatusSelectProps) {
  return (
    <div className={cn("relative z-10 flex items-center gap-2", className)}>
      <Select
        items={STATUS_OPTIONS}
        value={value}
        onValueChange={(next) =>
          next && onValueChange(next as SchoolSubmission["status"])
        }
        disabled={pending}
      >
        <SelectTrigger size="sm" className="w-full sm:w-32">
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
      {pending && <Spinner />}
    </div>
  );
}
