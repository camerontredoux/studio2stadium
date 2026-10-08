import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Sortable,
  SortableContent,
  SortableItem,
} from "@/components/ui/sortable";
import { toastManager } from "@/components/ui/toast-manager";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PlusIcon, RouteIcon } from "lucide-react";
import { useState } from "react";
import {
  useCreateTrackerItem,
  useDeleteTrackerItem,
  useDeleteTrackerSection,
  useReorderTrackerSections,
  useUpdateTrackerItem,
  type TrackerItem as Item,
} from "./api/mutations";
import { trackerQueries } from "./api/queries";
import {
  ItemDialog,
  type ItemChanges,
  type NewItem,
} from "./components/item-dialog";
import {
  OtherItemsCard,
  SchoolCard,
  type Handlers,
} from "./components/section-card";
import { Momentum, NextUp } from "./components/summary";
import {
  findCommitted,
  isDone,
  OFFER_STAGE,
  OTHER,
  sectionOf,
  STAGES,
} from "./stages";

function PageHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mb-2 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex flex-col max-sm:pl-1">
        <h1 className="text-2xl leading-none font-bold tracking-tight">
          My Recruiting Tracker
        </h1>
        <p className="text-muted-foreground text-sm">
          Keep your schools, clinics, auditions, and deadlines in one place.
        </p>
      </div>
      <Button size="sm" onClick={onAdd}>
        <PlusIcon /> Add Item
      </Button>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RouteIcon />
        </EmptyMedia>
        <EmptyTitle>Start your recruiting journey</EmptyTitle>
        <EmptyDescription>
          Add a school you're interested in, then track every clinic, audition,
          and deadline as you go from interested to committed.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={() => onAdd()}>
          <PlusIcon /> Add Your First Item
        </Button>
      </EmptyContent>
    </Empty>
  );
}

function celebrate(item: Pick<Item, "type" | "title">, stage: number) {
  const label = STAGES[item.type][stage];
  if (item.type === "school") {
    toastManager.add({
      type: "success",
      title: stage >= OFFER_STAGE ? `${label}: ${item.title}!` : "Nice move!",
      description:
        stage >= OFFER_STAGE
          ? "A huge milestone. Take a moment to celebrate."
          : `${item.title} is now at ${label}.`,
    });
  } else if (isDone({ type: item.type, stage })) {
    toastManager.add({
      type: "success",
      title: "Checked off",
      description: item.title,
    });
  }
}

// The API orders sections by school id, with null for "Everything else".
const toSection = (id: string | null) => id ?? OTHER;
const toSectionId = (section: string) => (section === OTHER ? null : section);

export function TrackerPage() {
  const { data } = useSuspenseQuery(trackerQueries.tracker());
  const { items } = data;
  const createItem = useCreateTrackerItem();
  const updateItem = useUpdateTrackerItem();
  const deleteItem = useDeleteTrackerItem();
  const committed = findCommitted(items);
  const deleteSection = useDeleteTrackerSection();
  const reorder = useReorderTrackerSections();
  const [dialog, setDialog] = useState<{
    key: number;
    open: boolean;
    school?: { id: string; name: string };
    item?: Item;
  }>({ key: 0, open: false });

  // Sections on the page, in the dancer's order. Any section missing from the
  // saved order goes first, so new schools land at the top.
  const order = data.sectionOrder.map(toSection);
  const present = new Set(items.map(sectionOf));
  const sections = [
    ...[...present].filter((s) => !order.includes(s)),
    ...order.filter((s) => present.has(s)),
  ];

  const saveOrder = (next: string[]) =>
    reorder.mutate({ body: { sections: next.map(toSectionId) } });

  const openAdd = (schoolId?: string) => {
    const school = items.find((i) => i.school?.id === schoolId)?.school;
    setDialog((prev) => ({
      key: prev.key + 1,
      open: true,
      school: school ?? undefined,
    }));
  };

  const openEdit = (item: Item) =>
    setDialog((prev) => ({ key: prev.key + 1, open: true, item }));

  const setStage = (item: Item, stage: number) => {
    updateItem.mutate({ params: { path: { id: item.id } }, body: { stage } });
    if (stage > item.stage) celebrate(item, stage);
  };

  const setSchoolStage = (
    school: { id: string; name: string },
    stage: number,
  ) => {
    const existing = items.find(
      (i) => i.type === "school" && i.school?.id === school.id,
    );
    if (existing) return setStage(existing, stage);
    // The school's section only holds other items so far; start its journey.
    createItem.mutate({ body: { type: "school", schoolId: school.id, stage } });
    celebrate({ type: "school", title: school.name }, stage);
  };

  const addItem = (item: NewItem) => {
    const section = item.schoolId ?? OTHER;
    createItem.mutate(
      { body: item },
      {
        onSuccess: () => {
          setDialog((prev) => ({ ...prev, open: false }));
          // A section that wasn't on the page starts at the top, even if an
          // old position for it is still saved.
          if (!present.has(section)) {
            saveOrder([section, ...sections]);
          }
        },
      },
    );
  };

  const saveItem = (item: Item, changes: ItemChanges) => {
    const section =
      changes.schoolId === undefined
        ? sectionOf(item)
        : (changes.schoolId ?? OTHER);
    updateItem.mutate(
      { params: { path: { id: item.id } }, body: changes },
      {
        onSuccess: () => {
          setDialog((prev) => ({ ...prev, open: false }));
          // Moving an item to a school that wasn't on the page puts that
          // school at the top, the same as adding one.
          if (!present.has(section)) saveOrder([section, ...sections]);
        },
      },
    );
    const stage = Number(changes.stage);
    if (stage > item.stage) celebrate(item, stage);
  };

  const handlers: Handlers = {
    onStageChange: setStage,
    onEdit: openEdit,
    onDelete: (id) => deleteItem.mutate({ params: { path: { id } } }),
    onAdd: openAdd,
  };

  return (
    <div className="mobile:pb-14 flex flex-col gap-2 pt-1 sm:pt-0">
      <PageHeader onAdd={() => openAdd()} />
      {items.length === 0 ? (
        <EmptyState onAdd={() => openAdd()} />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 items-start gap-2 *:min-w-0 md:grid-cols-2 md:gap-4">
            <Momentum items={items} />
            <NextUp items={items} />
          </div>
          <div className="flex flex-col gap-0.5 max-sm:pl-1">
            <h2 className="text-lg leading-tight font-semibold">
              Your schools
            </h2>
            <p className="text-muted-foreground text-sm">
              Tap a stage to update where you stand with each school.
            </p>
          </div>
          <Sortable
            value={sections}
            onValueChange={saveOrder}
            orientation="vertical"
          >
            <SortableContent className="flex flex-col gap-4">
              {sections.map((section) => {
                const sectionItems = items.filter(
                  (i) => sectionOf(i) === section,
                );
                const rows = sectionItems.filter((i) => i.type !== "school");
                const school = sectionItems[0]?.school;
                return (
                  <SortableItem key={section} value={section}>
                    {!school ? (
                      <OtherItemsCard items={rows} {...handlers} />
                    ) : (
                      <SchoolCard
                        school={school}
                        schoolItem={sectionItems.find(
                          (i) => i.type === "school",
                        )}
                        items={rows}
                        {...handlers}
                        commitLocked={
                          !!committed && committed.school?.id !== school.id
                        }
                        onSchoolStageChange={(stage) =>
                          setSchoolStage(school, stage)
                        }
                        onRemoveSchool={() =>
                          deleteSection.mutate({
                            body: { schoolId: school.id },
                          })
                        }
                      />
                    )}
                  </SortableItem>
                );
              })}
            </SortableContent>
          </Sortable>
        </div>
      )}
      <ItemDialog
        key={dialog.key}
        open={dialog.open}
        onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
        item={dialog.item}
        defaultSchool={dialog.school}
        defaultType={dialog.school ? "clinic" : "school"}
        committedId={committed?.id}
        onAdd={addItem}
        onSave={saveItem}
        pending={dialog.item ? updateItem.isPending : createItem.isPending}
      />
    </div>
  );
}
