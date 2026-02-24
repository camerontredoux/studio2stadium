import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/components/utils/cn";

export function HeroBadge({
  label,
  value,
  className,
}: {
  label: string;
  value: string | number | null;
  className?: string;
}) {
  return (
    <Card className={cn("flex-1 py-1! text-center", className)}>
      <CardHeader>
        <CardTitle className="text-muted-foreground group-hover:text-brand text-sm">
          {label}
        </CardTitle>
        <CardDescription className="text-primary text-sm">
          {value ?? "-"}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
