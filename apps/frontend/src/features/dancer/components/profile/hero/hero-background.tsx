import { Button } from "@/components/ui/button";
import { Share2Icon } from "lucide-react";
import { useProfile } from "../context/use-profile";

export function HeroBackground() {
  const { showOwnerControls } = useProfile();

  return (
    <div className="relative isolate transform-gpu overflow-clip sm:border-b">
      <img
        src="https://marketing.studio2stadium.com/_astro/hero.DGHTXfIc_1Jcoy3.webp"
        alt="Hero background"
        className="hidden h-32 w-full scale-105 rounded-2xl object-cover blur-sm sm:block sm:h-48"
      />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/70 via-black/20 to-transparent" />

      {showOwnerControls ? (
        <Button
          className="absolute top-3 right-3 flex items-center gap-2 text-white"
          size="xs"
          variant="ghost"
        >
          <Share2Icon /> Share
        </Button>
      ) : null}
    </div>
  );
}
