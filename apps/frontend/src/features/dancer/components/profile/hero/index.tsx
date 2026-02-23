import { Button } from "@/components/ui/button";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import { useNavigate } from "@tanstack/react-router";
import { Share2Icon, User2Icon } from "lucide-react";
import { type DancerProfile } from "../../../types";
import { FavoriteButton } from "../favorite-button";
import { HeroBackground } from "./hero-background";
import { HeroContent } from "./hero-content";
import { ProfilePicture } from "./profile-picture";

interface DancerHeroProps {
  visible: boolean;
  mode: "preview" | undefined;
  dancer: DancerProfile;
}

export function DancerHero({ visible, mode, dancer }: DancerHeroProps) {
  const navigate = useNavigate();

  const handlePreview = () => {
    navigate({
      to: "/$username",
      params: {
        username: dancer.username,
      },
      search: {
        mode: mode === "preview" ? undefined : "preview",
      },
    });
  };

  return (
    <Frame compact>
      <FramePanel side="top">
        <HeroBackground visible={visible} />

        <div className="hidden sm:block">
          <ProfilePicture avatar={dancer.avatar} />
        </div>

        <HeroContent dancer={dancer} visible={visible} />
      </FramePanel>

      <FrameFooter className="flex w-fit items-center gap-2 px-4 py-3 max-sm:w-full sm:px-5">
        {visible ? (
          <>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-2 sm:hidden"
            >
              <Share2Icon className="size-4" /> Share
            </Button>
            <Button size="sm" className="flex-1" onClick={handlePreview}>
              <User2Icon className="size-4" /> Preview
            </Button>
          </>
        ) : (
          <FavoriteButton dancerId={dancer.id} isFavorited={false} />
        )}
      </FrameFooter>
    </Frame>
  );
}
