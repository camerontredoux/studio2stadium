import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortableItemHandle } from "@/components/ui/sortable";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperList,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";
import { cn } from "@/components/utils/cn";
import {
  CheckCircle2Icon,
  CheckIcon,
  GripVerticalIcon,
  PlusIcon,
  SchoolIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import type { TrackerItem as Item } from "../api/mutations";
import {
  formatDate,
  isDone,
  SCHOOL_STAGE_ICONS,
  STAGES,
  TYPES,
} from "../stages";
import { DueBadge } from "./summary";

function SchoolJourney({
  school,
  stage,
  onStageChange,
}: {
  school: string;
  stage: number;
  onStageChange: (stage: number) => void;
}) {
  return (
    <Stepper
      value={STAGES.school[stage]}
      onValueChange={(value) => onStageChange(STAGES.school.indexOf(value))}
      activationMode="manual"
      // Sized by the card: labels only fit when the card is wide.
      className="@container w-full"
    >
      <StepperList aria-label={`Your stage with ${school}`}>
        {STAGES.school.map((label, i) => {
          const Icon = SCHOOL_STAGE_ICONS[i] ?? StarIcon;
          return (
            <StepperItem key={label} value={label}>
              <StepperTrigger className="group/stage cursor-pointer flex-col gap-1.5 p-0.5 not-has-data-[slot=description]:rounded-md">
                <StepperIndicator className="group-hover/stage:border-brand group-hover/stage:bg-brand group-hover/stage:animate-stage-pulse data-[state=active]:border-brand data-[state=active]:bg-brand data-[state=active]:ring-brand/20 data-[state=completed]:border-brand/40 data-[state=completed]:bg-brand/15 data-[state=completed]:text-brand transition-[transform,background-color,border-color,color] duration-200 ease-out group-hover/stage:scale-115 group-hover/stage:-rotate-12 group-hover/stage:text-white data-[state=active]:text-white data-[state=active]:ring-4 motion-reduce:transition-none motion-reduce:group-hover/stage:transform-none motion-reduce:group-hover/stage:animate-none">
                  {(state) =>
                    state === "completed" ? (
                      <CheckIcon className="size-4" />
                    ) : (
                      <Icon className="size-3.5" />
                    )
                  }
                </StepperIndicator>
                <StepperTitle className="text-muted-foreground in-data-[state=active]:text-foreground text-xs whitespace-nowrap @max-2xl:sr-only">
                  {label}
                </StepperTitle>
              </StepperTrigger>
              <StepperSeparator className="data-[state=completed]:bg-brand mx-1 mt-[calc(--spacing(0.5)+0.875rem)] mb-auto sm:mx-2" />
            </StepperItem>
          );
        })}
      </StepperList>
    </Stepper>
  );
}

function ItemRow({
  item,
  onStageChange,
  onDelete,
}: {
  item: Item;
  onStageChange: (stage: number) => void;
  onDelete: () => void;
}) {
  const done = isDone(item);
  const { label, Icon } = TYPES[item.type];
  const options = STAGES[item.type].map((stage, i) => ({
    value: String(i),
    label: stage,
  }));
  const RowIcon = done ? CheckCircle2Icon : Icon;

  return (
    <li className="flex flex-wrap items-start gap-x-3 gap-y-2 px-4 py-3">
      <RowIcon
        aria-hidden
        className={cn(
          "mt-0.5 size-4 shrink-0",
          done ? "text-success" : "text-brand",
        )}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p
          className={cn("text-sm font-medium", done && "text-muted-foreground")}
        >
          {item.title}
        </p>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
          <span>
            {label}
            {item.date && ` · ${formatDate(item.date)}`}
          </span>
          {item.date && !done && <DueBadge date={item.date} />}
        </div>
        {item.notes && <p className="text-xs">{item.notes}</p>}
      </div>
      <div className="flex items-center gap-1 max-sm:w-full max-sm:pl-7">
        <Select
          items={options}
          value={String(item.stage)}
          onValueChange={(next) => next && onStageChange(Number(next))}
        >
          <SelectTrigger
            size="sm"
            className="max-sm:flex-1 sm:w-32"
            aria-label={`Status for ${item.title}`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Delete ${item.title}`}
          onClick={onDelete}
        >
          <Trash2Icon />
        </Button>
      </div>
    </li>
  );
}

export type Handlers = {
  onStageChange: (item: Item, stage: number) => void;
  onDelete: (id: string) => void;
  onAdd: (schoolId?: string) => void;
};

function ReorderHandle({ label }: { label: string }) {
  return (
    <SortableItemHandle asChild>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={`Reorder ${label}`}
        className="-ml-3.5"
      >
        <GripVerticalIcon />
      </Button>
    </SortableItemHandle>
  );
}

export function SchoolCard({
  school,
  schoolItem,
  items,
  onSchoolStageChange,
  onRemoveSchool,
  onStageChange,
  onDelete,
  onAdd,
}: Handlers & {
  school: { id: string; name: string };
  schoolItem?: Item;
  items: Item[];
  onSchoolStageChange: (stage: number) => void;
  onRemoveSchool: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const stage = schoolItem?.stage ?? 0;

  return (
    <Frame>
      <FrameHeader>
        <div className="flex items-center gap-2">
          <ReorderHandle label={school.name} />
          <FrameTitle className="flex min-w-0 items-center gap-2 text-base">
            <SchoolIcon aria-hidden className="text-brand size-4 shrink-0" />
            <span className="truncate">{school.name}</span>
          </FrameTitle>
          <Button
            variant="ghost"
            size="icon-xs"
            className="ml-auto"
            aria-label={`Remove ${school.name} from your tracker`}
            onClick={() => setConfirming(true)}
          >
            <Trash2Icon />
          </Button>
        </div>
        {schoolItem?.notes && (
          <p className="text-muted-foreground text-sm">{schoolItem.notes}</p>
        )}
      </FrameHeader>
      <FramePanel>
        <SchoolJourney
          school={school.name}
          stage={stage}
          onStageChange={onSchoolStageChange}
        />
      </FramePanel>
      {items.length > 0 && (
        <FramePanel className="p-0!">
          <ul className="divide-y">
            {items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onStageChange={(next) => onStageChange(item, next)}
                onDelete={() => onDelete(item.id)}
              />
            ))}
          </ul>
        </FramePanel>
      )}
      <FrameFooter className="px-2">
        <Button variant="ghost" size="xs" onClick={() => onAdd(school.id)}>
          <PlusIcon /> Add a clinic, audition, or deadline
        </Button>
      </FrameFooter>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {school.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the school and everything you're tracking for it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {items.length > 0 && (
            <ul className="text-muted-foreground list-disc px-6 pb-4 pl-10 text-sm">
              {items.map((item) => (
                <li key={item.id}>{item.title}</li>
              ))}
            </ul>
          )}
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" />}>
              Cancel
            </AlertDialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirming(false);
                onRemoveSchool();
              }}
            >
              Remove School
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Frame>
  );
}

export function OtherItemsCard({
  items,
  onStageChange,
  onDelete,
  onAdd,
}: Handlers & { items: Item[] }) {
  return (
    <Frame>
      <FrameHeader>
        <div className="flex items-center gap-2">
          <ReorderHandle label="Everything else" />
          <FrameTitle className="text-base">Everything else</FrameTitle>
        </div>
      </FrameHeader>
      <FramePanel className="p-0!">
        <ul className="divide-y">
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onStageChange={(next) => onStageChange(item, next)}
              onDelete={() => onDelete(item.id)}
            />
          ))}
        </ul>
      </FramePanel>
      <FrameFooter className="px-2">
        <Button variant="ghost" size="xs" onClick={() => onAdd()}>
          <PlusIcon /> Add an item
        </Button>
      </FrameFooter>
    </Frame>
  );
}
