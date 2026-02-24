import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import { type DancerProfile } from "../../../types";
import { HeroBackground } from "./hero-background";
import { HeroContent } from "./hero-content";
import { HeroFooter } from "./hero-footer";
import { ProfilePicture } from "./profile-picture";

interface DancerHeroProps {
  dancer: DancerProfile;
}

export function DancerHero({ dancer }: DancerHeroProps) {
  return (
    <Frame compact>
      <FramePanel side="top">
        <HeroBackground />

        <div className="hidden sm:block">
          <ProfilePicture
            fallback={dancer.firstName[0] + dancer.lastName[0]}
            avatar={dancer.avatar}
          />
        </div>

        <HeroContent dancer={dancer} />
      </FramePanel>

      <FrameFooter>
        <HeroFooter dancerId={dancer.id} />
      </FrameFooter>
    </Frame>
  );
}
