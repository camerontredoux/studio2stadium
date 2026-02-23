import { getYouTubeId } from "@/utils/get-youtube-id";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useSubmitVideo } from "../../api/mutations";
import { ConfirmStep } from "./confirm";
import { SchoolsStep } from "./schools";
import { StepIndicator } from "./step-indicator";
import { SuccessView } from "./success";
import type { School, Step } from "./types";
import { VideoStep } from "./video";

export function SubmitPage() {
  const navigate = useNavigate();
  const { mutate, isPending } = useSubmitVideo();

  const [step, setStep] = useState<Step>("video");
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedSchools, setSelectedSchools] = useState<School[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const videoId = getYouTubeId(videoUrl);

  const handleSubmit = () => {
    if (!videoId) return;
    mutate(
      {
        body: {
          schoolId: selectedSchools.map((s) => s.id),
          videoId,
        },
      },
      {
        onSuccess: () => setSubmitted(true),
      },
    );
  };

  if (submitted) {
    return (
      <SuccessView
        schoolCount={selectedSchools.length}
        onViewSubmissions={() => navigate({ to: "/recruiting" })}
      />
    );
  }

  return (
    <div className="mobile:pb-14 flex flex-col gap-4 lg:gap-6">
      <div className="flex flex-col gap-0.5 max-sm:pl-1">
        <h1 className="text-2xl leading-none font-bold tracking-tight">
          Submit Video
        </h1>
        <p className="text-muted-foreground text-sm">
          Share your talent with dance programs across the country
        </p>
      </div>

      <StepIndicator currentStep={step} onStepClick={setStep} />

      {step === "video" && (
        <VideoStep
          videoUrl={videoUrl}
          onVideoUrlChange={setVideoUrl}
          onNext={() => setStep("schools")}
        />
      )}

      {step === "schools" && (
        <SchoolsStep
          selectedSchools={selectedSchools}
          onSelectionChange={setSelectedSchools}
          onBack={() => setStep("video")}
          onNext={() => setStep("confirm")}
        />
      )}

      {step === "confirm" && videoId && (
        <ConfirmStep
          videoId={videoId}
          videoUrl={videoUrl}
          selectedSchools={selectedSchools}
          isSubmitting={isPending}
          onEditVideo={() => setStep("video")}
          onBack={() => setStep("schools")}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
