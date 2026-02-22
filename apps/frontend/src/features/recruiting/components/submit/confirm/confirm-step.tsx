import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeftIcon, LoaderCircleIcon, SendIcon } from "lucide-react";
import type { School } from "../types";
import { SchoolPreviewCard } from "./school-preview-card";
import { VideoPreview } from "./video-preview";

interface ConfirmStepProps {
  videoId: string;
  videoUrl: string;
  selectedSchools: School[];
  isSubmitting: boolean;
  onEditVideo: () => void;
  onBack: () => void;
  onSubmit: () => void;
}

export function ConfirmStep({
  videoId,
  videoUrl,
  selectedSchools,
  isSubmitting,
  onEditVideo,
  onBack,
  onSubmit,
}: ConfirmStepProps) {
  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className="flex flex-col gap-4 rounded-xl border p-4 sm:p-6">
        <h2 className="text-base font-semibold">Review Submission</h2>

        <div className="flex flex-col gap-4 lg:flex-row">
          <VideoPreview
            videoId={videoId}
            videoUrl={videoUrl}
            onEdit={onEditVideo}
          />

          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <ScrollArea className="h-64" scrollFade>
              <div className="flex flex-col gap-1.5">
                {selectedSchools.map((school) => (
                  <SchoolPreviewCard key={school.id} school={school} />
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeftIcon /> Back
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting} className="gap-2">
          {isSubmitting ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : (
            <SendIcon />
          )}{" "}
          Submit to {selectedSchools.length} School
          {selectedSchools.length !== 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
}
