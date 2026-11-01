import type { ApiSchemas } from "@/lib/api/client";
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
    why: "Help coaches get to know your dance experience, interests, and what makes you unique.",
  },
  video: {
    title: "Upload a video",
    action: "Upload a Video",
    why: "Showcase your talent and help coaches see what you can bring to their team.",
  },
  program_views: {
    title: "Explore at least five college programs",
    action: "Explore Programs",
    why: "See what's out there. You might discover a team you hadn't considered before!",
  },
  tracker: {
    title: "Add a recruiting item to your tracker",
    action: "Open My Tracker",
    why: "Find a clinic, audition, or deadline and save it to your tracker to keep your next steps organized.",
  },
  favorite: {
    title: "Connect with your first program",
    action: "Favorite a Program",
    why: "Favorite a program to get on its coach's radar. You'll be notified when they view your profile!",
  },
};

const SKILLS_REQUIRED = 10;

// What the dancer still has to add, worded like the profile checklist.
export function missingProfileItems(
  checklist: ApiSchemas["DancersMeChecklistResponse"],
) {
  const missing: string[] = [];
  if (!checklist.skills) {
    const count = checklist.skillCount;
    missing.push(
      `Select ${SKILLS_REQUIRED - count} more skills (${count}/${SKILLS_REQUIRED})`,
    );
  }
  if (!checklist.styles) missing.push("Select a style");
  if (!checklist.sports) missing.push("Select a sport");
  if (!checklist.location) missing.push("Choose your location");
  if (!checklist.gpa) missing.push("Enter your GPA");
  return missing;
}

export function stepDetail(step: RoadmapStep) {
  if (step.key === "program_views" && step.status !== "complete") {
    return `${STEP_COPY.program_views.why} ${step.count ?? 0} of ${step.target ?? 5} viewed so far.`;
  }
  if (step.status === "processing") {
    return "Your video is processing. This step completes when it's viewable.";
  }
  if (step.status === "not_ready") {
    return `Complete your profile and upload a video to unlock this step. Then ${STEP_COPY.favorite.why[0].toLowerCase()}${STEP_COPY.favorite.why.slice(1)}`;
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
