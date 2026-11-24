import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { useQuery } from "@tanstack/react-query";
import { ChevronsUpDownIcon, SearchIcon, SendIcon } from "lucide-react";
import { type ReactElement, useCallback, useMemo, useState } from "react";
import { recruitingQueries } from "../../api/queries";
import { useSendSpotlight } from "../../api/mutations";

// Internal S2S accounts that are not real programs a dancer can spotlight.
const EXCLUDED_PROGRAM_USERNAMES = new Set(["S2SAdmin"]);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SendSpotlightDialog({ trigger }: { trigger: ReactElement }) {
  const [open, setOpen] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  const { data: schools } = useQuery({
    ...recruitingQueries.programs(),
    enabled: open,
  });
  const { mutate, isPending } = useSendSpotlight();

  // Base UI's Combobox feeds `items` and `programName` into memos that back
  // layout effects; a fresh array/function each render re-runs those effects
  // (setState → re-render → loop). Keep both stable, keyed on the query data.
  const programName = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of schools ?? []) {
      if (EXCLUDED_PROGRAM_USERNAMES.has(s.username)) continue;
      map.set(s.id, s.name);
    }
    return map;
  }, [schools]);
  const programIds = useMemo(() => [...programName.keys()], [programName]);
  const labelForId = useCallback(
    (id: string) => programName.get(id) ?? "",
    [programName],
  );

  const handleSend = () => {
    if (!schoolId) return;
    mutate(
      { body: { schoolId } },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Spotlight sent",
            description:
              "Your profile is now featured in that program's rotation for 7 days.",
            type: "success",
          });
          setSchoolId(null);
          setOpen(false);
        },
        onError: (error) => {
          // The backend blocks a repeat send to the same program within the
          // 30-day cooldown and returns the date they're eligible again.
          const nextEligibleAt = (
            error as { meta?: { nextEligibleAt?: string } }
          )?.meta?.nextEligibleAt;
          toastManager.add({
            title: "Couldn't send spotlight",
            description: nextEligibleAt
              ? `You can spotlight this program again on ${formatDate(nextEligibleAt)}.`
              : (error?.message ?? "Please try again."),
            type: "error",
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send a Spotlight</DialogTitle>
          <DialogDescription>
            Feature your profile in a program's Dancer Spotlights rotation for
            7 days.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <Field name="school">
            <FieldLabel>Program</FieldLabel>
            {programIds.length === 0 ? (
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <Spinner /> Loading programs…
              </p>
            ) : (
              <Combobox
                value={schoolId}
                onValueChange={(id) => setSchoolId(id)}
                items={programIds}
                itemToStringLabel={labelForId}
                autoHighlight
              >
                <ComboboxTrigger
                  render={
                    <Button
                      className="w-full justify-between font-normal"
                      variant="outline"
                    />
                  }
                >
                  <ComboboxValue>
                    {(id: string | null) =>
                      id ? labelForId(id) : "Choose a program"
                    }
                  </ComboboxValue>
                  <ChevronsUpDownIcon className="-me-1!" />
                </ComboboxTrigger>
                <ComboboxPopup aria-label="Choose a program">
                  <div className="border-b p-2">
                    <ComboboxInput
                      size="sm"
                      className="rounded-md before:rounded-[calc(var(--radius-md)-1px)]"
                      placeholder="Search programs…"
                      showTrigger={false}
                      startAddon={<SearchIcon />}
                    />
                  </div>
                  <ComboboxEmpty>No programs found.</ComboboxEmpty>
                  <ComboboxList>
                    {(id: string) => (
                      <ComboboxItem key={id} value={id}>
                        {labelForId(id)}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxPopup>
              </Combobox>
            )}
          </Field>
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button
            onClick={handleSend}
            disabled={!schoolId || isPending}
            className="gap-2"
          >
            {isPending ? <Spinner /> : <SendIcon className="size-4" />}
            Send a Spotlight
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
