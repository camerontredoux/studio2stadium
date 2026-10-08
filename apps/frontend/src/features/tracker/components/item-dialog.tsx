import { Button } from "@/components/ui/button";
import { CalendarPopover } from "@/components/ui/calendar-popover";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@/components/ui/combobox";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/components/utils/cn";
import type { ApiSchemas } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { SearchIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { TrackerItem } from "../api/mutations";
import { trackerQueries } from "../api/queries";
import { STAGES, TYPES, type ItemType } from "../stages";

export type NewItem = ApiSchemas["TrackerItemsRequest"];
export type ItemChanges = ApiSchemas["TrackerItemsIdRequest"];

// Adds an item, or edits `item` when one is passed. An item's type can't
// change, and a school item stays tied to its school.
export function ItemDialog({
  open,
  onOpenChange,
  onAdd,
  onSave,
  pending,
  item,
  defaultSchool,
  defaultType = "school",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (item: NewItem) => void;
  onSave: (item: TrackerItem, changes: ItemChanges) => void;
  pending: boolean;
  item?: TrackerItem;
  defaultSchool?: { id: string; name: string };
  defaultType?: ItemType;
}) {
  const editing = !!item;
  const [type, setType] = useState<ItemType>(item?.type ?? defaultType);
  const [title, setTitle] = useState(item?.title ?? "");
  const [schoolId, setSchoolId] = useState<string | null>(
    item?.school?.id ?? defaultSchool?.id ?? null,
  );
  const [date, setDate] = useState(item?.date ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [stage, setStage] = useState(String(item?.stage ?? 0));

  const { data: schools } = useQuery({
    ...trackerQueries.schools(),
    enabled: open,
  });

  // Base UI's Combobox reruns layout effects when `items` or
  // `itemToStringLabel` change identity, so both are memoized.
  const itemSchool = item?.school;
  const schoolNames = useMemo(() => {
    const names = new Map((schools ?? []).map((s) => [s.id, s.name]));
    if (defaultSchool) names.set(defaultSchool.id, defaultSchool.name);
    if (itemSchool) names.set(itemSchool.id, itemSchool.name);
    return names;
  }, [schools, defaultSchool, itemSchool]);
  const schoolIds = useMemo(() => [...schoolNames.keys()], [schoolNames]);
  const schoolName = useCallback(
    (id: string) => schoolNames.get(id) ?? "",
    [schoolNames],
  );

  const isSchool = type === "school";
  const typeOptions = (Object.keys(TYPES) as ItemType[]).map((t) => ({
    value: t,
    label: TYPES[t].label,
  }));
  const stageOptions = STAGES[type].map((label, i) => ({
    value: String(i),
    label,
  }));
  const canSubmit = (isSchool ? !!schoolId : !!title.trim()) && !pending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>
            {editing ? `Edit ${item.title}` : "Add a recruiting item"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the details you're tracking."
              : "Track a school, clinic, audition, application step, or deadline."}
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Type</FieldLabel>
            <Select
              items={typeOptions}
              value={type}
              disabled={editing}
              onValueChange={(next) => {
                if (!next) return;
                setType(next as ItemType);
                setStage("0");
              }}
            >
              <SelectTrigger aria-label="Type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {!isSchool && (
            <Field>
              <FieldLabel>Title</FieldLabel>
              <Input
                value={title}
                placeholder="e.g. Fall prep clinic"
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
          )}
          <Field>
            <FieldLabel>{isSchool ? "School" : "School (optional)"}</FieldLabel>
            <Combobox
              items={schoolIds}
              value={schoolId}
              onValueChange={setSchoolId}
              itemToStringLabel={schoolName}
              disabled={editing && isSchool}
              autoHighlight
            >
              <ComboboxInput
                placeholder="Search schools"
                startAddon={<SearchIcon />}
                showClear={!isSchool && !!schoolId}
              />
              <ComboboxPopup aria-label="Schools">
                <ComboboxEmpty>
                  {schools ? "No schools found." : "Loading schools…"}
                </ComboboxEmpty>
                <ComboboxList>
                  {(id: string) => (
                    <ComboboxItem key={id} value={id}>
                      {schoolName(id)}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxPopup>
            </Combobox>
          </Field>
          <div className={cn("grid gap-4", !isSchool && "sm:grid-cols-2")}>
            <Field>
              <FieldLabel>{isSchool ? "Where you are" : "Status"}</FieldLabel>
              <Select
                items={stageOptions}
                value={stage}
                onValueChange={(next) => next && setStage(next)}
              >
                <SelectTrigger
                  aria-label={isSchool ? "Where you are" : "Status"}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {!isSchool && (
              <Field>
                <FieldLabel htmlFor="tracker-item-date">
                  Date (optional)
                </FieldLabel>
                <CalendarPopover
                  id="tracker-item-date"
                  placeholder="Pick a date"
                  labelVariant="PP"
                  value={date ? new Date(`${date}T12:00:00`) : undefined}
                  onSelect={(d) => setDate(d ? format(d, "yyyy-MM-dd") : "")}
                />
              </Field>
            )}
          </div>
          <Field>
            <FieldLabel>Notes (optional)</FieldLabel>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </DialogPanel>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() =>
              editing
                ? onSave(item, {
                    title: isSchool ? undefined : title.trim(),
                    schoolId: isSchool ? undefined : schoolId,
                    date: isSchool ? undefined : date || null,
                    notes: notes.trim() || null,
                    stage: Number(stage),
                  })
                : onAdd({
                    type,
                    title: isSchool ? undefined : title.trim(),
                    schoolId: schoolId ?? undefined,
                    date: isSchool ? undefined : date || undefined,
                    notes: notes.trim() || undefined,
                    stage: Number(stage),
                  })
            }
          >
            {pending ? (
              <Spinner label={editing ? "Saving…" : "Adding…"} />
            ) : editing ? (
              "Save Changes"
            ) : (
              "Add to Tracker"
            )}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
