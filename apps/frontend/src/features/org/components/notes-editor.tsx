import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { $api } from "@/lib/api/client";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { useOrg } from "@/features/org/context/use-org";
import { Textarea } from "@/components/ui/textarea";

export function NotesEditor({
  dancerRosterId,
  initial,
}: {
  dancerRosterId: string;
  initial: string | null;
}) {
  const { org } = useOrg();
  const qc = useQueryClient();
  const [content, setContent] = useState(initial ?? "");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>(initial ?? "");
  const dirty = content !== lastSavedRef.current;

  const upsert = $api.useMutation(
    "put",
    "/orgs/{slug}/dancers/{dancerRosterId}/notes",
  );
  const remove = $api.useMutation(
    "delete",
    "/orgs/{slug}/dancers/{dancerRosterId}/notes",
  );

  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const trimmed = content.trim();
      if (trimmed === "") {
        await remove.mutateAsync({
          params: { path: { slug: org.slug, dancerRosterId } },
        });
      } else {
        await upsert.mutateAsync({
          params: { path: { slug: org.slug, dancerRosterId } },
          body: { content },
        });
      }
      lastSavedRef.current = content;
      setSavedAt(new Date());
      qc.invalidateQueries({ queryKey: scoutingQueries.dancers(org.slug).queryKey });
      qc.invalidateQueries({ queryKey: scoutingQueries.dancer(org.slug, dancerRosterId).queryKey });
    } catch {
      // keep dirty; user can try again
    } finally {
      setSaving(false);
    }
  }

  // 2s idle autosave
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (dirty) {
      timer.current = setTimeout(save, 2000);
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  // beforeunload guard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={save}
        placeholder="Your private notes on this dancer…"
        className="min-h-32"
        maxLength={5000}
      />
      <div className="text-muted-foreground text-xs">
        {saving
          ? "Saving…"
          : dirty
            ? "Unsaved changes"
            : savedAt
              ? `Saved ${savedAt.toLocaleTimeString()}`
              : ""}
      </div>
    </div>
  );
}
