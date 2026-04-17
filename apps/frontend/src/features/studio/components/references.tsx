import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import {
  AiOutlineInstagram,
  AiOutlineTikTok,
  AiOutlineYoutube,
} from "react-icons/ai";
import { MailIcon } from "lucide-react";

export function References() {
  const references = [
    { icon: <MailIcon className="size-4" />, label: "5280DanceCo@gmail.com" },
    { icon: <AiOutlineInstagram className="size-5" />, label: "DanceAt5280" },
    { icon: <AiOutlineTikTok className="size-5" />, label: "DanceAt5280" },
    { icon: <AiOutlineYoutube className="size-5" />, label: "DanceAt5280" },
  ];

  return (
    <div className="hidden md:block">
      <Frame>
        <FrameHeader>
          <FrameTitle>Contact Info</FrameTitle>
        </FrameHeader>

        <FramePanel side="bottom">
          <div className="flex min-w-0 flex-col gap-2">
            {references.map((ref, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-brand">{ref.icon}</span>
                <span>{ref.label}</span>
              </div>
            ))}
          </div>
        </FramePanel>
      </Frame>
    </div>
  );
}