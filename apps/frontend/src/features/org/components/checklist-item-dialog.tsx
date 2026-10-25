import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/event/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/event/dialog";
import { toastManager } from "@/components/ui/toast-manager";
import {
  adminQueries,
  type ChecklistItem,
} from "@/features/org/api/admin-queries";
import { BusyLabel } from "@/features/org/live/shared/busy-label";
import { SheetField } from "@/features/org/live/shared/sheet-field";
import { client } from "@/lib/api/client";

const schema = z.object({
  title: z.string().min(1, "Required").max(160),
});

type Schema = z.infer<typeof schema>;

const FORM_ID = "checklist-item-dialog-form";

export interface ChecklistItemDialogProps {
  orgSlug: string;
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: ChecklistItem;
}

export function ChecklistItemDialog({
  orgSlug,
  eventId,
  open,
  onOpenChange,
  item,
}: ChecklistItemDialogProps) {
  const qc = useQueryClient();
  const isCreate = item === undefined;
  const queryKey = adminQueries.checklist(orgSlug, eventId).queryKey;

  const createMutation = useMutation({
    mutationFn: async (body: { title: string }) => {
      const { error } = await client.POST(
        "/orgs/{slug}/events/{id}/checklist",
        {
          params: { path: { slug: orgSlug, id: eventId } },
          body,
        },
      );
      if (error) throw error;
    },
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<ChecklistItem[]>(queryKey);
      const optimistic: ChecklistItem = {
        id: `optimistic-${Date.now()}`,
        eventId,
        title: body.title,
        description: null,
        completed: false,
        position: prev?.length ?? 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      qc.setQueryData<ChecklistItem[]>(queryKey, (old) => [
        ...(old ?? []),
        optimistic,
      ]);
      onOpenChange(false);
      return { prev };
    },
    onError: (_err, _body, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
      toastManager.add({ title: "Couldn't add item", type: "error" });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (body: { title: string }) => {
      if (!item) throw new Error("Item is required to update");
      const { error } = await client.PATCH(
        "/orgs/{slug}/events/{id}/checklist/{itemId}",
        {
          params: { path: { slug: orgSlug, id: eventId, itemId: item.id } },
          body,
        },
      );
      if (error) throw error;
    },
    onMutate: async (body) => {
      if (!item) return;
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<ChecklistItem[]>(queryKey);
      qc.setQueryData<ChecklistItem[]>(queryKey, (old) =>
        old?.map((i) => (i.id === item.id ? { ...i, title: body.title } : i)),
      );
      onOpenChange(false);
      return { prev };
    },
    onError: (_err, _body, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
      toastManager.add({ title: "Couldn't update item", type: "error" });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey });
    },
  });

  const { control, handleSubmit, reset } = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: { title: item?.title ?? "" },
  });

  useEffect(() => {
    if (!open) return;
    reset({ title: item?.title ?? "" });
  }, [open, item, reset]);

  const pending = isCreate
    ? createMutation.isPending
    : updateMutation.isPending;

  const onSubmit = (data: Schema) => {
    if (pending) return;
    const payload = {
      title: data.title,
    };
    if (isCreate) {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>
            {isCreate ? "Add checklist item" : "Edit checklist item"}
          </DialogTitle>
        </DialogHeader>
        <form
          id={FORM_ID}
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-col"
        >
          <DialogBody>
            <Controller
              control={control}
              name="title"
              render={({ field, fieldState }) => (
                <SheetField
                  label="Title"
                  name={field.name}
                  ref={field.ref}
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  autoFocus
                  placeholder="e.g. Venue confirmed"
                />
              )}
            />
          </DialogBody>
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" size="lg" />}>
            Cancel
          </DialogClose>
          <Button
            type="submit"
            form={FORM_ID}
            variant="primary"
            size="lg"
            disabled={pending}
          >
            {pending ? (
              <BusyLabel label={isCreate ? "Adding…" : "Saving…"} />
            ) : isCreate ? (
              "Add item"
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
