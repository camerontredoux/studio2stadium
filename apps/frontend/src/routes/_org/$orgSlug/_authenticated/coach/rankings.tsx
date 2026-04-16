import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { Button } from "@/components/ui/button";
import { useOrg } from "@/features/org/context/use-org";
import { toastManager } from "@/components/ui/toast-manager";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/coach/rankings",
)({
  component: Rankings,
});

function Rankings() {
  const { orgSlug } = useParams({
    from: "/_org/$orgSlug/_authenticated/coach/rankings",
  });
  const { settings } = useOrg();
  const max =
    (settings as { rating_scale_max?: number }).rating_scale_max ?? 10;
  const { data } = useSuspenseQuery(scoutingQueries.rankings(orgSlug));

  const copyNotes = async () => {
    const text = data
      .filter((d) => d.note)
      .map(
        (d) =>
          `#${d.bibNumber ?? "—"} ${d.firstName} ${d.lastName}${
            d.rating != null ? ` (${d.rating}/${max})` : ""
          }\n${d.note}`,
      )
      .join("\n\n");
    if (!text) {
      toastManager.add({ title: "No notes to copy yet.", type: "info" });
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toastManager.add({ title: "Notes copied to clipboard", type: "success" });
    } catch {
      toastManager.add({ title: "Could not copy to clipboard", type: "error" });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold">Your Rankings</h1>
          <p className="text-muted-foreground text-sm">
            {data.length} {data.length === 1 ? "dancer" : "dancers"} scouted
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={copyNotes}>
          Copy notes
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="text-muted-foreground bg-card rounded-lg border p-8 text-center text-sm">
          Start favoriting and rating dancers. They'll show up here in your
          personal rankings.
        </div>
      ) : (
        <ol className="flex flex-col gap-2">
          {data.map((d, i) => (
            <li key={d.rosterId}>
              <Link
                to="/$orgSlug/coach/dancers/$rosterId"
                params={{ orgSlug, rosterId: d.rosterId }}
                className="bg-card hover:bg-accent/50 flex items-center gap-3 rounded-lg border p-3 transition-colors"
              >
                <span className="text-muted-foreground w-6 text-right font-mono text-sm">
                  {i + 1}
                </span>
                <div className="bg-muted size-10 shrink-0 overflow-hidden rounded-full">
                  {d.profilePhotoUrl ? (
                    <img
                      src={d.profilePhotoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {d.bibNumber != null && (
                      <span className="text-muted-foreground font-mono text-xs">
                        #{d.bibNumber}
                      </span>
                    )}
                    <span className="truncate font-medium">
                      {d.firstName} {d.lastName}
                    </span>
                  </div>
                  {d.note && (
                    <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                      {d.note}
                    </p>
                  )}
                </div>
                {d.rating != null && (
                  <div className="flex items-baseline gap-0.5 font-mono">
                    <span className="text-primary text-lg font-semibold">
                      {d.rating}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      /{max}
                    </span>
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
