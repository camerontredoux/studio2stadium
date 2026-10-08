import type {
  PremiumRoadmap,
  RoadmapStep,
  StepKey,
} from "@/shared/premium-roadmap/types";

export const ROADMAP_DAYS = 30;

export const STEP_COPY: Record<
  StepKey,
  { title: string; action: string; why: string }
> = {
  profile: {
    title: "Complete your profile",
    action: "Complete My Profile",
    why: "The coach should receive useful and current information.",
  },
  video: {
    title: "Upload a recruiting video",
    action: "Upload a Video",
    why: "A coach needs visual evidence of your skills.",
  },
  program_views: {
    title: "Explore five college programs",
    action: "Explore Programs",
    why: "Research programs before you send your profile.",
  },
  tracker: {
    title: "Add a recruiting item to your tracker",
    action: "Open My Tracker",
    why: "Start organizing a real deadline, clinic, audition, or school.",
  },
  favorite: {
    title: "Connect with your first program",
    action: "Favorite a Program",
    why: "Favoriting follows the program and sends your profile to the coach.",
  },
};

export function stepDetail(step: RoadmapStep) {
  if (step.key === "program_views" && step.status !== "complete") {
    return `${step.count ?? 0} of ${step.target ?? 5} programs viewed`;
  }
  if (step.status === "processing") {
    return "Your video is processing. This step completes when it's viewable.";
  }
  if (step.status === "not_ready") {
    return "Finish your profile and video first. Favoriting sends your profile to the coach.";
  }
  return STEP_COPY[step.key].why;
}

// The first incomplete step, skipping the favorite step until it is ready.
export function nextStep(roadmap: PremiumRoadmap) {
  return roadmap.steps.find(
    (s) => s.status !== "complete" && s.status !== "not_ready",
  );
}

export function isComplete(roadmap: PremiumRoadmap) {
  return roadmap.steps.every((s) => s.status === "complete");
}

// Expanded until completion or day 30, whichever comes first.
export function isCollapsedByDefault(roadmap: PremiumRoadmap) {
  return isComplete(roadmap) || roadmap.daysSinceStart > ROADMAP_DAYS;
}
