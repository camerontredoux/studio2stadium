import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/components/utils/cn";
import {
  CheckIcon,
  EllipsisIcon,
  FlagIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { TrackerMilestone as Milestone } from "../api/mutations";

// A chip's round indicator. On hover it fills with gold, tilts, and pulses,
// like the stage stepper did.
const INDICATOR =
  "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-[transform,background-color,border-color,color] duration-200 ease-out group-hover/milestone:border-brand group-hover/milestone:bg-brand group-hover/milestone:animate-stage-pulse group-hover/milestone:scale-115 group-hover/milestone:-rotate-12 group-hover/milestone:text-white motion-reduce:transition-none motion-reduce:group-hover/milestone:transform-none motion-reduce:group-hover/milestone:animate-none";

const MAX_TITLE = 80;

const TOGGLE_COOLDOWN_MS = 1000;

// Shared by adding and renaming. Input styles its wrapper with className, so
// reach the field inside to fill it and keep the text clear of its rounded ends.
const FIELD =
  "h-9 w-48 rounded-2xl before:rounded-[calc(var(--radius-2xl)-1px)] sm:h-9 *:data-[slot=input]:h-full *:data-[slot=input]:px-4";

function Indicator({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        INDICATOR,
        done ? "border-brand bg-brand text-white" : "text-muted-foreground",
      )}
    >
      {done ? (
        <CheckIcon className="size-3.5" />
      ) : (
        <FlagIcon className="size-3" />
      )}
    </span>
  );
}

function MilestoneChip({
  milestone,
  onToggle,
  onRename,
  onDelete,
}: {
  milestone: Milestone;
  onToggle: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const done = !!milestone.completedAt;
  const [renaming, setRenaming] = useState(false);
  // The hover preview fills the icon gold, so after a click it holds off until
  // the pointer leaves; otherwise an unchecked chip still looks checked.
  const [quiet, setQuiet] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const refocus = useRef(false);
  const lastToggle = useRef(0);

  // Enter and Escape hand focus back to the chip; a blur leaves it where the
  // dancer moved it.
  useEffect(() => {
    if (!renaming && refocus.current) toggleRef.current?.focus();
    refocus.current = false;
  }, [renaming]);

  const finish = (title: string | null, keyboard: boolean) => {
    const next = title?.trim();
    if (next && next !== milestone.title) onRename(next);
    refocus.current = keyboard;
    setRenaming(false);
  };

  if (renaming) {
    return (
      <Input
        autoFocus
        size="sm"
        className={FIELD}
        aria-label={`Rename ${milestone.title}`}
        defaultValue={milestone.title}
        maxLength={MAX_TITLE}
        onBlur={(e) => finish(e.currentTarget.value, false)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            // Focus moves to the chip before the keypress lands, which
            // would otherwise click it and undo the check.
            e.preventDefault();
            finish(e.currentTarget.value, true);
          }
          if (e.key === "Escape") finish(null, true);
        }}
      />
    );
  }

  return (
    <div className="bg-background flex h-9 items-center gap-0.5 rounded-2xl border pe-1">
      <Toggle
        ref={toggleRef}
        pressed={done}
        onClick={() => {
          setQuiet(true);
          // Rapid clicks would otherwise each send a request.
          const now = Date.now();
          if (now - lastToggle.current < TOGGLE_COOLDOWN_MS) return;
          lastToggle.current = now;
          onToggle();
        }}
        onPointerLeave={() => setQuiet(false)}
        className={cn(
          !quiet && "group/milestone",
          "h-full rounded-2xl ps-1 pe-2 before:rounded-2xl data-pressed:bg-transparent sm:h-full",
        )}
      >
        <Indicator done={done} />
        {milestone.title}
      </Toggle>
      <Menu>
        <MenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              className="rounded-full before:rounded-full"
              aria-label={`Options for ${milestone.title}`}
            />
          }
        >
          <EllipsisIcon />
        </MenuTrigger>
        <MenuPopup align="end">
          <MenuItem onClick={() => setRenaming(true)}>
            <PencilIcon /> Rename
          </MenuItem>
          <MenuItem variant="destructive" onClick={onDelete}>
            <Trash2Icon /> Delete
          </MenuItem>
        </MenuPopup>
      </Menu>
    </div>
  );
}

function AddMilestone({
  school,
  onAdd,
}: {
  school: string;
  onAdd: (title: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const refocus = useRef(false);

  useEffect(() => {
    if (!adding && refocus.current) buttonRef.current?.focus();
    refocus.current = false;
  }, [adding]);

  const close = (keyboard: boolean) => {
    refocus.current = keyboard;
    setTitle("");
    setAdding(false);
  };

  if (adding) {
    return (
      <Input
        autoFocus
        size="sm"
        className={FIELD}
        aria-label={`New milestone for ${school}`}
        maxLength={MAX_TITLE}
        value={title}
        onChange={(e) => setTitle(e.currentTarget.value)}
        // Leaving with a title saves it, so a typed milestone isn't lost.
        onBlur={() => {
          if (title.trim()) onAdd(title.trim());
          close(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && title.trim()) {
            // Stay open and empty, ready for the next one.
            onAdd(title.trim());
            setTitle("");
          }
          if (e.key === "Escape") close(true);
        }}
      />
    );
  }

  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      className="group/milestone text-muted-foreground border-border h-9 rounded-2xl border-dashed ps-1 pe-3 before:rounded-[calc(var(--radius-2xl)-1px)] sm:h-9"
      onClick={() => setAdding(true)}
    >
      <span aria-hidden className={cn(INDICATOR, "border-transparent")}>
        <PlusIcon className="size-3.5" />
      </span>
      Add milestone
    </Button>
  );
}

export function Milestones({
  school,
  milestones,
  onAdd,
  onToggle,
  onRename,
  onDelete,
}: {
  school: string;
  milestones: Milestone[];
  onAdd: (title: string) => void;
  /** `chip` is the toggled chip, for confetti. */
  onToggle: (milestone: Milestone) => void;
  onRename: (milestone: Milestone, title: string) => void;
  onDelete: (milestone: Milestone) => void;
}) {
  const labelId = useId();
  return (
    <div className="flex flex-col gap-2">
      <p id={labelId} className="text-sm font-medium">
        Your milestones
      </p>
      <ul aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {milestones.map((milestone) => (
          <li key={milestone.id}>
            <MilestoneChip
              milestone={milestone}
              onToggle={() => onToggle(milestone)}
              onRename={(title) => onRename(milestone, title)}
              onDelete={() => onDelete(milestone)}
            />
          </li>
        ))}
        <li>
          <AddMilestone school={school} onAdd={onAdd} />
        </li>
      </ul>
    </div>
  );
}
