import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import { AvatarUploadDialog } from "@/shared/images/components/avatar-upload/avatar-upload-dialog";
import { type DancerProfile } from "../../../types";
import { useProfile } from "../context/use-profile";
import { HeroBackground } from "./hero-background";
import { HeroContent } from "./hero-content";
import { HeroFooter } from "./hero-footer";
import { ProfilePicture } from "./profile-picture";

interface DancerHeroProps {
  dancer: DancerProfile;
}

export function DancerHero({ dancer }: DancerHeroProps) {
  const { showOwnerControls } = useProfile();

  const initials = dancer.firstName[0] + dancer.lastName[0];

  return (
    <Frame compact>
      <FramePanel side="top">
        <HeroBackground />

        <div className="hidden sm:block">
          {showOwnerControls ? (
            <AvatarUploadDialog avatar={dancer.avatar} fallback={initials} />
          ) : (
            <ProfilePicture fallback={initials} avatar={dancer.avatar} />
          )}
        </div>

        <HeroContent showOwnerControls={showOwnerControls} dancer={dancer} />
      </FramePanel>

      <FrameFooter>
        <HeroFooter dancerId={dancer.id} />
      </FrameFooter>
    </Frame>
  );
}
