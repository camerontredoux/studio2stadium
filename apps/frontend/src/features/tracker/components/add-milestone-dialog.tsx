import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Fieldset, FieldsetLegend } from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Radio, RadioGroup } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { canSubmitCommonRecruitingVideo } from "@/lib/common-recruiting";
import { useSession } from "@/lib/session/hooks/use-session";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState, type ReactElement, type RefObject } from "react";
import { useCreateTrackerMilestone } from "../api/mutations";
import { trackerQueries } from "../api/queries";
import { SchoolLogo } from "./school-logo";

const VIDEO_SUGGESTION = "Submit my common recruiting video";

// Starting points only; picking one fills the field for the dancer to edit.
const SUGGESTIONS = [
  "Research the team's recruiting or audition requirements",
  "Send an introduction to the coach",
  VIDEO_SUGGESTION,
  "Follow up after a clinic",
  "Ask the coach for feedback",
  "Work on a skill the coach recommended",
  "Complete the team's recruiting questionnaire",
];

type School = { id: string; name: string; avatar: string | null };

function AddMilestoneForm({
  school,
  maxLength,
  inputRef,
  onClose,
}: {
  school: School;
  maxLength: number;
  inputRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
}) {
  const { username } = useSession();
  const { data: dancer } = useQuery(trackerQueries.dancer(username));
  const [picked, setPicked] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const createMilestone = useCreateTrackerMilestone();

  // The video is for graduating seniors and older, the same rule as
  // submitting one; hide it until the profile says so.
  const suggestions = SUGGESTIONS.filter(
    (suggestion) =>
      suggestion !== VIDEO_SUGGESTION ||
      canSubmitCommonRecruitingVideo(dancer?.gradYear ?? null),
  );

  const submit = () => {
    const next = title.trim();
    if (!next || createMilestone.isPending) return;
    // Close once the save lands; on failure the error toasts and the dialog
    // stays open with the title, so the dancer can try again.
    createMilestone.mutate(
      { body: { schoolId: school.id, title: next } },
      { onSuccess: onClose },
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add a milestone</DialogTitle>
        <DialogDescription>
          Choose a starting point or create your own.
        </DialogDescription>
        <div className="flex items-center gap-2 pt-2">
          <SchoolLogo school={school} />
          <p className="min-w-0 truncate font-medium">{school.name}</p>
        </div>
      </DialogHeader>
      <DialogPanel className="flex flex-col gap-4">
        <Fieldset className="max-w-none gap-2">
          <FieldsetLegend className="text-sm">
            Suggested milestones
          </FieldsetLegend>
          <RadioGroup
            className="gap-2"
            value={picked}
            onValueChange={(value) => {
              setPicked(value as string);
              setTitle(value as string);
            }}
          >
            {suggestions.map((suggestion) => (
              <Label
                key={suggestion}
                className="hover:bg-accent/50 has-data-checked:border-brand/48 has-data-checked:bg-brand/8 gap-3 rounded-lg border p-3 font-normal"
              >
                <Radio value={suggestion} />
                {suggestion}
              </Label>
            ))}
          </RadioGroup>
        </Fieldset>
        <Separator />
        <Field>
          <FieldLabel>Make it your own</FieldLabel>
          <Input
            ref={inputRef}
            value={title}
            maxLength={maxLength}
            placeholder="Write your own milestone"
            onChange={(e) => setTitle(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
          <FieldDescription>
            Personalize this step for your journey with this program.
          </FieldDescription>
        </Field>
      </DialogPanel>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={!title.trim() || createMilestone.isPending}
          onClick={submit}
        >
          {createMilestone.isPending ? (
            <Spinner label="Adding…" />
          ) : (
            "Add milestone"
          )}
        </Button>
      </DialogFooter>
    </>
  );
}

export function AddMilestoneDialog({
  school,
  maxLength,
  trigger,
}: {
  school: School;
  maxLength: number;
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      {/* Focus lands on the field, so the dancer can type their own right
          away, as the inline input this replaced did. */}
      <DialogPopup initialFocus={inputRef}>
        {/* Mounted only while open, so each opening starts blank. */}
        <AddMilestoneForm
          school={school}
          maxLength={maxLength}
          inputRef={inputRef}
          onClose={() => setOpen(false)}
        />
      </DialogPopup>
    </Dialog>
  );
}
