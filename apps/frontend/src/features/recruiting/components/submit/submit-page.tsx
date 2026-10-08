import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { dancerQueries } from "@/features/dancer/api/queries";
import { useSession } from "@/lib/session/hooks/use-session";
import { getYouTubeId } from "@/utils/get-youtube-id";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { GraduationCapIcon } from "lucide-react";
import { useState } from "react";
import { useSubmitVideo } from "../../api/mutations";
import { ConfirmStep } from "./confirm";
import { SchoolsStep } from "./schools";
import { StepIndicator } from "./step-indicator";
import { SuccessView } from "./success";
import type { School, Step } from "./types";
import { VideoStep } from "./video";

// Common recruiting video submission is open to graduating seniors and older
// — dancers graduating in this year or earlier (lower grad year == older).
const LATEST_ELIGIBLE_GRAD_YEAR = 2027;

export function SubmitPage() {
  const navigate = useNavigate();
  const { mutate, isPending } = useSubmitVideo();

  const { username } = useSession();
  const { data: dancer } = useSuspenseQuery(dancerQueries.profile(username));
  const canSubmit =
    dancer.gradYear != null && dancer.gradYear <= LATEST_ELIGIBLE_GRAD_YEAR;

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

  if (!canSubmit) {
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

        <Alert variant="warning">
          <GraduationCapIcon />
          <AlertTitle>Only graduating seniors and older can submit</AlertTitle>
          <AlertDescription>
            Common recruiting video submissions are open to graduating seniors
            (class of {LATEST_ELIGIBLE_GRAD_YEAR}) and older. Because you
            graduate after {LATEST_ELIGIBLE_GRAD_YEAR}, you can't submit a video
            right now.
          </AlertDescription>
        </Alert>
      </div>
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
