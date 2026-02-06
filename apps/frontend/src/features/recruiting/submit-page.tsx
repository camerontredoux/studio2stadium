import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  LinkIcon,
  MapPinIcon,
  SchoolIcon,
  SearchIcon,
  SendIcon,
  VideoIcon,
} from "lucide-react";
import { useState } from "react";
import {
  MOCK_ALL_SCHOOLS,
  type SelectableSchool,
} from "./components/mock-data";
import { extractYouTubeId } from "./components/utils/extract-youtube-id";
import { VideoEditor } from "./components/video-editor";

type Step = "video" | "schools" | "confirm";

const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: "video", label: "Video", icon: <VideoIcon className="size-4" /> },
  {
    key: "schools",
    label: "Schools",
    icon: <SchoolIcon className="size-4" />,
  },
  { key: "confirm", label: "Confirm", icon: <SendIcon className="size-4" /> },
];

export function SubmitPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("video");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoError, setVideoError] = useState<string>();
  const [selectedSchools, setSelectedSchools] = useState<Set<string>>(
    new Set(),
  );
  const [schoolSearch, setSchoolSearch] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const videoId = extractYouTubeId(videoUrl);

  const filteredSchools = MOCK_ALL_SCHOOLS.filter(
    (school) =>
      school.name.toLowerCase().includes(schoolSearch.toLowerCase()) ||
      school.location.toLowerCase().includes(schoolSearch.toLowerCase()),
  );

  const toggleSchool = (id: string) => {
    setSelectedSchools((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedSchools(new Set(filteredSchools.map((s) => s.id)));
  };

  const deselectAll = () => {
    setSelectedSchools(new Set());
  };

  const goToSchools = () => {
    if (!videoUrl.trim()) {
      setVideoError("Please enter a YouTube video link");
      return;
    }
    if (!extractYouTubeId(videoUrl)) {
      setVideoError("Please enter a valid YouTube URL");
      return;
    }
    setVideoError(undefined);
    setStep("schools");
  };

  const goToConfirm = () => {
    setStep("confirm");
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const selectedSchoolsList = MOCK_ALL_SCHOOLS.filter((s) =>
    selectedSchools.has(s.id),
  );

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 text-center max-lg:pb-24">
        <div className="relative">
          <div className="bg-success/10 rounded-full p-6">
            <CheckIcon className="text-success-foreground size-10" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-bold tracking-tight">
            Submissions Sent
          </h2>
          <p className="text-muted-foreground max-w-md">
            Your video has been submitted to {selectedSchools.size} school
            {selectedSchools.size !== 1 ? "s" : ""}. You can track their
            responses on the recruiting dashboard.
          </p>
        </div>
        <Button size="lg" onClick={() => navigate({ to: "/recruiting" })}>
          View Submissions
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-lg:pb-14 lg:gap-6">
      <div className="flex flex-col gap-0.5 max-sm:pl-1">
        <h1 className="text-2xl leading-none font-bold tracking-tight">
          Submit Video
        </h1>
        <p className="text-muted-foreground text-sm">
          Share your talent with dance programs across the country
        </p>
      </div>

      <div className="flex items-center gap-0 sm:gap-1">
        {STEPS.map((s, i) => {
          const stepIndex = STEPS.findIndex((x) => x.key === step);
          const thisIndex = i;
          const isActive = s.key === step;
          const isComplete = thisIndex < stepIndex;

          return (
            <div
              key={s.key}
              className="flex flex-1 items-center gap-0 last:flex-none sm:gap-1"
            >
              <button
                type="button"
                onClick={() => {
                  if (isComplete) setStep(s.key);
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
                    thisIndex < stepIndex ? "bg-success/40" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {step === "video" && (
        <div className="flex flex-col gap-4 lg:gap-6">
          <VideoEditor
            videoUrl={videoUrl}
            onVideoUrlChange={setVideoUrl}
            videoError={videoError}
            onErrorClear={() => setVideoError(undefined)}
          />

          <div className="flex justify-end">
            <Button onClick={goToSchools} className="gap-2">
              Select Schools <ArrowRightIcon />
            </Button>
          </div>
        </div>
      )}

      {step === "schools" && (
        <div className="flex flex-col gap-4 lg:gap-6">
          <div className="flex flex-col gap-4 rounded-xl border p-4 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold">Select Schools</h2>
                <p className="text-muted-foreground text-sm">
                  Choose which programs receive your video
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="brand">{selectedSchools.size} selected</Badge>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={
                    selectedSchools.size === filteredSchools.length
                      ? deselectAll
                      : selectAll
                  }
                >
                  {selectedSchools.size === filteredSchools.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </div>
            </div>

            <div className="relative">
              <InputGroup>
                <Input
                  placeholder="Search schools by name or location..."
                  value={schoolSearch}
                  onChange={(e) => setSchoolSearch(e.target.value)}
                  className="pl-9"
                />
                <InputGroupAddon align="inline-start">
                  <SearchIcon />
                </InputGroupAddon>
              </InputGroup>
            </div>

            <ScrollArea scrollFade className="h-96">
              <div className="flex flex-col gap-1.5">
                {filteredSchools.map((school) => (
                  <SchoolSelectRow
                    key={school.id}
                    school={school}
                    selected={selectedSchools.has(school.id)}
                    onToggle={() => toggleSchool(school.id)}
                  />
                ))}
                {filteredSchools.length === 0 && (
                  <div className="text-muted-foreground py-8 text-center text-sm">
                    No schools match your search
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep("video")}
              className="gap-2"
            >
              <ArrowLeftIcon /> Back
            </Button>
            <Button
              onClick={goToConfirm}
              disabled={selectedSchools.size === 0}
              className="gap-2"
            >
              Review & Submit <ArrowRightIcon />
            </Button>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div className="flex flex-col gap-4 lg:gap-6">
          <div className="flex flex-col gap-4 rounded-xl border p-4 sm:p-6">
            <h2 className="text-base font-semibold">Review Submission</h2>

            <div className="flex flex-col gap-4 lg:flex-row">
              {videoId && (
                <div className="w-full self-start overflow-clip rounded-xl border bg-black/5 lg:w-80 lg:shrink-0 dark:bg-white/5">
                  <div className="aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title="Recruiting video preview"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full"
                    />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 text-sm">
                    <LinkIcon className="text-brand size-3.5 shrink-0" />
                    <span className="text-muted-foreground flex-1 truncate">
                      {videoUrl}
                    </span>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="shrink-0"
                      onClick={() => setStep("video")}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <ScrollArea className="h-64" scrollFade>
                  <div className="flex flex-col gap-1.5">
                    {selectedSchoolsList.map((school) => (
                      <div
                        key={school.id}
                        className="flex items-center gap-3 rounded-lg border px-3 py-2"
                      >
                        <Avatar className="size-8 shrink-0 rounded-lg">
                          <AvatarImage src={school.avatar} />
                          <AvatarFallback>{school.initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {school.name}
                          </div>
                          <div className="text-muted-foreground flex items-center gap-1 text-xs">
                            <MapPinIcon className="size-3 shrink-0" />
                            {school.location}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep("schools")}
              className="gap-2"
            >
              <ArrowLeftIcon /> Back
            </Button>
            <Button onClick={handleSubmit} className="gap-2">
              <SendIcon /> Submit to {selectedSchools.size} School
              {selectedSchools.size !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SchoolSelectRow({
  school,
  selected,
  onToggle,
}: {
  school: SelectableSchool;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
        selected
          ? "border-brand/30 bg-brand/5"
          : "border-border hover:bg-accent/50"
      }`}
    >
      <Checkbox checked={selected} onCheckedChange={onToggle} />
      <Avatar className="size-9 shrink-0 rounded-lg">
        <AvatarImage src={school.avatar} />
        <AvatarFallback>{school.initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{school.name}</div>
        <div className="text-muted-foreground flex items-center gap-1 text-xs">
          <MapPinIcon className="size-3 shrink-0" /> {school.location}
        </div>
      </div>
      <Button
        variant="outline"
        size="xs"
        className="shrink-0"
        render={
          <Link
            to="/explore/$username"
            params={{ username: school.username }}
            target="_blank"
          />
        }
        onClick={(e) => e.stopPropagation()}
      >
        View Profile
      </Button>
    </label>
  );
}
