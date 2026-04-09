import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/components/utils/cn";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  tone?: "default" | "muted" | "accent";
  className?: string;
}

export function StatCard({
  label,
  value,
  subtitle,
  icon,
  tone = "default",
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-md",
        tone === "accent" &&
          "border-[color:var(--org-primary,var(--color-primary))]/20",
        className,
      )}
    >
      {tone === "accent" && (
        <div
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{
            backgroundColor:
              "var(--org-primary, var(--color-primary))",
          }}
          aria-hidden="true"
        />
      )}
      <CardContent className="flex flex-col gap-1 py-5">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {label}
          </span>
          {icon && (
            <span
              className="text-muted-foreground/60 group-hover:text-foreground/80 transition-colors"
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
        </div>
        <div className="text-3xl font-semibold tabular-nums tracking-tight">
          {value}
        </div>
        {subtitle && (
          <div className="text-muted-foreground text-xs">{subtitle}</div>
        )}
      </CardContent>
    </Card>
  );
}
