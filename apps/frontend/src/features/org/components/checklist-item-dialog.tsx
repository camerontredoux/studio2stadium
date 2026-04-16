import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import {
  adminQueries,
  type ChecklistItem,
} from "@/features/org/api/admin-queries";
import { client } from "@/lib/api/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

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

  const rawClient = client as unknown as {
    POST: (
      path: string,
      opts: { body: unknown },
    ) => Promise<{ data: ChecklistItem }>;
    PATCH: (
      path: string,
      opts: { body: Record<string, unknown> },
    ) => Promise<{ data: ChecklistItem }>;
  };

  const createMutation = useMutation({
    mutationFn: async (body: { title: string }) => {
      const res = await rawClient.POST(
        `/orgs/${orgSlug}/events/${eventId}/checklist`,
        { body },
      );
      return res.data;
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
      const res = await rawClient.PATCH(
        `/orgs/${orgSlug}/events/${eventId}/checklist/${item.id}`,
        { body },
      );
      return res.data;
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isCreate ? "Add checklist item" : "Edit checklist item"}
          </DialogTitle>
        </DialogHeader>
        <form
          id={FORM_ID}
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 px-6 pt-2 pb-2"
        >
          <Controller
            control={control}
            name="title"
            render={({ field, fieldState }) => (
              <Field name={field.name} invalid={fieldState.invalid}>
                <FieldLabel>Title</FieldLabel>
                <Input
                  autoFocus
                  placeholder="e.g. Venue confirmed"
                  {...field}
                />
                <FieldError error={fieldState.error} />
              </Field>
            )}
          />
        </form>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} disabled={pending}>
            {pending ? (
              <Spinner label={isCreate ? "Adding…" : "Saving…"} />
            ) : isCreate ? (
              "Add item"
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
