import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import type { SchoolProfile } from "@/features/school/types";
import { HeroBackground } from "./hero-background";
import { HeroContent } from "./hero-content";
import { HeroFooter } from "./hero-footer";
import { ProfilePicture } from "./profile-picture";

interface SchoolHeroProps {
  school: SchoolProfile;
}

export function SchoolHero({ school }: SchoolHeroProps) {
  const initials = school.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Frame compact>
      <FramePanel side="top">
        <HeroBackground />

        <div className="hidden sm:block">
          <ProfilePicture fallback={initials} avatar={school.avatar} />
        </div>

        <HeroContent school={school} />
      </FramePanel>

      <FrameFooter>
        <HeroFooter school={school} />
      </FrameFooter>
    </Frame>
  );
}
