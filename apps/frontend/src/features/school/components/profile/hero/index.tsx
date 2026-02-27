import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import type { SchoolProfile } from "@/features/school/types";
import { AvatarUploadDialog } from "@/shared/images/components/avatar-upload/avatar-upload-dialog";
import { useProfile } from "../context/use-profile";
import { HeroBackground } from "./hero-background";
import { HeroContent } from "./hero-content";
import { HeroFooter } from "./hero-footer";
import { ProfilePicture } from "./profile-picture";

interface SchoolHeroProps {
  school: SchoolProfile;
}

export function SchoolHero({ school }: SchoolHeroProps) {
  const { showOwnerControls } = useProfile();
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
          {showOwnerControls ? (
            <AvatarUploadDialog avatar={school.avatar} fallback={initials} />
          ) : (
            <ProfilePicture fallback={initials} avatar={school.avatar} />
          )}
        </div>

        <HeroContent school={school} showOwnerControls={showOwnerControls} />
      </FramePanel>

      <FrameFooter>
        <HeroFooter school={school} />
      </FrameFooter>
    </Frame>
  );
}
