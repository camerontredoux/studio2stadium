import {
  CheckIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/event/button";
import { Checkbox } from "@/components/event/checkbox";
import { Panel, PanelHead } from "@/components/event/panel";
import { ProgressBar } from "@/components/event/progress-bar";
import { Input } from "@/components/ui/input";
import { toastManager } from "@/components/ui/toast-manager";
import { cn } from "@/components/utils/cn";
import {
  adminQueries,
  type ChecklistItem,
} from "@/features/org/api/admin-queries";
import type { EventPhaseInfo } from "@/features/org/hooks/use-event-phase";
import { ConfirmDialog } from "@/features/org/live/shared/confirm-dialog";
import { inputControl } from "@/features/org/live/shared/sheet-field";
import { client } from "@/lib/api/client";

/**
 * The old dashboard's pre-event checklist, kept as a compact panel below the
 * board until the event starts. Click a row to tick it; hover (or focus) shows
 * rename and delete.
 */
export function ChecklistPanel({
  orgSlug,
  eventId,
  phase,
}: {
  orgSlug: string;
  eventId: string;
  phase: EventPhaseInfo;
}) {
  const qc = useQueryClient();
  const queryKey = adminQueries.checklist(orgSlug, eventId).queryKey;
  const { data: items = [], isPending } = useQuery(
    adminQueries.checklist(orgSlug, eventId),
  );
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [deleting, setDeleting] = useState<ChecklistItem | null>(null);

  const done = items.filter((i) => i.completed).length;
  const total = items.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const days = phase.daysUntilStart;
  // Day 1 before its start time counts as due now.
  const due = days <= 0 ? "Due now" : days > 14 ? "On track" : `${days}d left`;

  const patch = async (
    itemId: string,
    body: { title?: string; completed?: boolean },
  ) => {
    const { error } = await client.PATCH(
      "/orgs/{slug}/events/{id}/checklist/{itemId}",
      { params: { path: { slug: orgSlug, id: eventId, itemId } }, body },
    );
    if (error) throw error;
  };

  // Optimistic edits roll back and toast on failure, as on the old dashboard.
  const optimistic = (update: (old: ChecklistItem[]) => ChecklistItem[]) => {
    const prev = qc.getQueryData<ChecklistItem[]>(queryKey);
    qc.setQueryData<ChecklistItem[]>(queryKey, (old) => update(old ?? []));
    return { prev };
  };
  const rollback =
    (title: string) =>
    (_err: unknown, _vars: unknown, ctx?: { prev?: ChecklistItem[] }) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
      toastManager.add({ title, type: "error" });
    };
  const settle = () => qc.invalidateQueries({ queryKey });

  const toggle = useMutation({
    mutationFn: (item: ChecklistItem) =>
      patch(item.id, { completed: !item.completed }),
    onMutate: async (item) => {
      await qc.cancelQueries({ queryKey });
      return optimistic((old) =>
        old.map((i) =>
          i.id === item.id ? { ...i, completed: !i.completed } : i,
        ),
      );
    },
    onError: rollback("Couldn't update item"),
    onSettled: settle,
  });

  const rename = useMutation({
    mutationFn: ({ itemId, title }: { itemId: string; title: string }) =>
      patch(itemId, { title }),
    onMutate: async ({ itemId, title }) => {
      await qc.cancelQueries({ queryKey });
      setEditingId(null);
      return optimistic((old) =>
        old.map((i) => (i.id === itemId ? { ...i, title } : i)),
      );
    },
    onError: rollback("Couldn't update item"),
    onSettled: settle,
  });

  const create = useMutation({
    mutationFn: async (title: string) => {
      const { error } = await client.POST(
        "/orgs/{slug}/events/{id}/checklist",
        { params: { path: { slug: orgSlug, id: eventId } }, body: { title } },
      );
      if (error) throw error;
    },
    onMutate: async (title) => {
      await qc.cancelQueries({ queryKey });
      setDraft("");
      const now = new Date().toISOString();
      return optimistic((old) => [
        ...old,
        {
          id: `optimistic-${Date.now()}`,
          eventId,
          title,
          description: null,
          completed: false,
          position: old.length,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    },
    onError: rollback("Couldn't add item"),
    onSettled: settle,
  });

  const remove = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await client.DELETE(
        "/orgs/{slug}/events/{id}/checklist/{itemId}",
        { params: { path: { slug: orgSlug, id: eventId, itemId } } },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      setDeleting(null);
      void settle();
    },
    onError: () => {
      toastManager.add({ title: "Couldn't delete item", type: "error" });
    },
  });

  const submitDraft = () => {
    const title = draft.trim();
    if (title) create.mutate(title);
  };
  const submitEdit = (itemId: string) => {
    const title = editDraft.trim();
    if (title) rename.mutate({ itemId, title });
  };

  return (
    <Panel>
      <PanelHead
        label="Pre-event checklist"
        count={total > 0 ? `${done}/${total}` : undefined}
        actions={
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setAdding(true)}
            disabled={adding}
          >
            <PlusIcon />
            Add item
          </Button>
        }
      >
        <span className="type-meta text-fg-3 hidden sm:inline">{due}</span>
      </PanelHead>

      {total > 0 && (
        <div className="border-line border-b px-(--space-14) py-(--space-10)">
          <ProgressBar value={pct} label="Checklist complete" />
        </div>
      )}

      <ul className="m-0 flex list-none flex-col p-0">
        {items.map((item) =>
          editingId === item.id ? (
            <li
              key={item.id}
              className="border-line flex items-center gap-(--space-6) border-b px-(--space-8) py-(--space-6) last:border-b-0"
            >
              <ItemInput
                value={editDraft}
                onChange={setEditDraft}
                onSubmit={() => submitEdit(item.id)}
                onCancel={() => setEditingId(null)}
                label={`Rename "${item.title}"`}
              />
              <Button
                size="sm"
                variant="ghost"
                iconOnly
                label="Save"
                disabled={!editDraft.trim()}
                onClick={() => submitEdit(item.id)}
              >
                <CheckIcon />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                iconOnly
                label="Cancel"
                onClick={() => setEditingId(null)}
              >
                <XIcon />
              </Button>
            </li>
          ) : (
            <li
              key={item.id}
              className="group border-line hover:bg-surface-hover flex min-h-9 items-center gap-(--space-10) border-b pr-(--space-8) pl-(--space-14) last:border-b-0"
            >
              <Checkbox
                label={item.title}
                aria-label={item.title}
                checked={item.completed}
                onChange={() => toggle.mutate(item)}
                className={cn(
                  "min-w-0 flex-1 py-(--space-8) text-[13px]",
                  item.completed && "text-fg-3 line-through",
                )}
              />
              <div className="flex shrink-0 items-center gap-(--space-2) opacity-100 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 pointer-fine:opacity-0">
                <Button
                  size="sm"
                  variant="ghost"
                  iconOnly
                  label={`Rename "${item.title}"`}
                  onClick={() => {
                    setEditingId(item.id);
                    setEditDraft(item.title);
                  }}
                >
                  <PencilSimpleIcon />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  iconOnly
                  label={`Delete "${item.title}"`}
                  onClick={() => setDeleting(item)}
                >
                  <TrashIcon />
                </Button>
              </div>
            </li>
          ),
        )}
        {adding && (
          <li className="flex items-center gap-(--space-6) px-(--space-8) py-(--space-6)">
            <ItemInput
              value={draft}
              onChange={setDraft}
              onSubmit={submitDraft}
              onCancel={() => {
                setAdding(false);
                setDraft("");
              }}
              label="New checklist item"
              placeholder="Add checklist item"
            />
            <Button
              size="sm"
              variant="secondary"
              disabled={!draft.trim()}
              onClick={submitDraft}
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              iconOnly
              label="Done adding"
              onClick={() => {
                setAdding(false);
                setDraft("");
              }}
            >
              <XIcon />
            </Button>
          </li>
        )}
        {!adding && total === 0 && (
          <li className="type-body text-fg-3 px-(--space-14) py-(--space-12)">
            {isPending ? "Loading…" : "Nothing on the checklist yet."}
          </li>
        )}
      </ul>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete checklist item?"
        description={`"${deleting?.title ?? ""}" is removed from the checklist.`}
        confirmLabel="Delete"
        pending={remove.isPending}
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
        }}
      />
    </Panel>
  );
}

function ItemInput({
  value,
  onChange,
  onSubmit,
  onCancel,
  label,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  label: string;
  placeholder?: string;
}) {
  return (
    <Input
      autoFocus
      value={value}
      aria-label={label}
      placeholder={placeholder}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        onChange(e.target.value)
      }
      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onSubmit();
        }
        if (e.key === "Escape") onCancel();
      }}
      className={cn(inputControl, "min-w-0 flex-1")}
    />
  );
}
