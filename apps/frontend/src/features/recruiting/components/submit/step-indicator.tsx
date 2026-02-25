import { CheckIcon, SchoolIcon, SendIcon, VideoIcon } from "lucide-react";
import type { Step } from "./types";

const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: "video", label: "Video", icon: <VideoIcon className="size-4" /> },
  { key: "schools", label: "Schools", icon: <SchoolIcon className="size-4" /> },
  { key: "confirm", label: "Confirm", icon: <SendIcon className="size-4" /> },
];

interface StepIndicatorProps {
  currentStep: Step;
  onStepClick: (step: Step) => void;
}

export function StepIndicator({
  currentStep,
  onStepClick,
}: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center gap-0 sm:gap-1">
      {STEPS.map((s, i) => {
        const isActive = s.key === currentStep;
        const isComplete = i < currentIndex;

        return (
          <div
            key={s.key}
            className="flex flex-1 items-center gap-0 last:flex-none sm:gap-1"
          >
            <button
              type="button"
              onClick={() => {
                if (isComplete) onStepClick(s.key);
              }}
              disabled={!isComplete && !isActive}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand/10 text-brand border-brand/20 border"
                  : isComplete
                    ? "bg-success/10 text-success-foreground border-success/20 hover:bg-success/16 cursor-pointer border"
                    : "bg-muted text-muted-foreground border border-transparent"
              }`}
            >
              {isComplete ? <CheckIcon className="size-4" /> : s.icon}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-1 h-px flex-1 sm:mx-2 ${
                  i < currentIndex ? "bg-success/40" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
