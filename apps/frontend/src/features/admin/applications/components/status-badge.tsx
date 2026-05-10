import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/utils/cn";

type ApplicationStatus = "pending" | "accepted" | "rejected";

interface StatusBadgeProps {
  status: ApplicationStatus;
  className?: string;
}

const statusConfig = {
  accepted: {
    variant: "success" as const,
    dotColor: "bg-emerald-500",
  },
  rejected: {
    variant: "error" as const,
    dotColor: "bg-red-500",
  },
  pending: {
    variant: "warning" as const,
    dotColor: "bg-amber-500",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={cn("rounded-full", className)}>
      <span className="relative flex size-1.5">
        <span
          className={`absolute size-full animate-ping rounded-full ${config.dotColor}`}
        />
        <span className={`relative size-1.5 rounded-full ${config.dotColor}`} />
      </span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
