import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_org/$orgSlug/_authenticated/coach/")({
  component: CoachIndex,
});

function CoachIndex() {
  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-muted-foreground text-sm">
        Coach dashboard — pick a tab
      </p>
    </div>
  );
}
