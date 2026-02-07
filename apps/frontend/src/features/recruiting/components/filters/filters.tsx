import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldLabel } from "@/components/ui/field";

interface FiltersProps {
  prospectStatus: string;
  videoStatus: string;
  onProspectStatusChange: (value: string) => void;
  onVideoStatusChange: (value: string) => void;
}

const PROSPECT_OPTIONS = [
  { value: "all", label: "All" },
  { value: "accepted", label: "Accepted" },
  { value: "in-review", label: "In Review" },
  { value: "rejected", label: "Rejected" },
  { value: "none", label: "Pending" },
] as const;

const VIDEO_OPTIONS = [
  { value: "all", label: "All" },
  { value: "watched", label: "Watched" },
  { value: "none", label: "Not Watched" },
] as const;

export function Filters({
  prospectStatus,
  videoStatus,
  onProspectStatusChange,
  onVideoStatusChange,
}: FiltersProps) {
  const prospectActive = prospectStatus !== "all";
  const videoActive = videoStatus !== "all";

  return (
    <Accordion defaultValue={["prospect-status", "video-status"]} multiple>
      <AccordionItem value="prospect-status" className="relative px-5">
        <AccordionTrigger>
          <div className="flex w-full items-center justify-between gap-2">
            Prospect Status {prospectActive ? <Badge>Active</Badge> : null}
          </div>
        </AccordionTrigger>
        <AccordionPanel>
          <div className="flex flex-col gap-3 py-2">
            {PROSPECT_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2.5 text-sm"
              >
                <Checkbox
                  checked={prospectStatus === option.value}
                  onCheckedChange={(checked) => {
                    if (checked) onProspectStatusChange(option.value);
                  }}
                />
                <FieldLabel className="cursor-pointer">
                  {option.label}
                </FieldLabel>
              </label>
            ))}
          </div>
        </AccordionPanel>
      </AccordionItem>

      <AccordionItem value="video-status" className="relative px-5">
        <AccordionTrigger>
          <div className="flex w-full items-center justify-between gap-2">
            Video Status {videoActive ? <Badge>Active</Badge> : null}
          </div>
        </AccordionTrigger>
        <AccordionPanel>
          <div className="flex flex-col gap-3 py-2">
            {VIDEO_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2.5 text-sm"
              >
                <Checkbox
                  checked={videoStatus === option.value}
                  onCheckedChange={(checked) => {
                    if (checked) onVideoStatusChange(option.value);
                  }}
                />
                <FieldLabel className="cursor-pointer">
                  {option.label}
                </FieldLabel>
              </label>
            ))}
          </div>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}
