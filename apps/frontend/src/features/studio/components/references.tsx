import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/ui/frame";

const EMAIL_ICON =
  "https://d1wf5hycmlyms9.cloudfront.net/email-1-svgrepo-com58963abb-0d7a-42ed-8a5d-94b32cc0a961.png";
const INSTAGRAM_ICON =
  "https://d1wf5hycmlyms9.cloudfront.net/instagram-svgrepo-comf0d9724b-9028-4fc1-9d8c-448fa0299188.png";
const TIKTOK_ICON =
  "https://d1wf5hycmlyms9.cloudfront.net/tiktok-svgrepo-com20fe26ac-4505-4ec0-8a6d-9cb2c71d60eb.png";
const YOUTUBE_ICON =
  "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/youtube.svg";

export function References() {
  const references = [
    { icon: EMAIL_ICON, label: "dance_studio@gmail.com" },
    { icon: INSTAGRAM_ICON, label: "dance_studio" },
    { icon: TIKTOK_ICON, label: "dance_studio" },
    { icon: YOUTUBE_ICON, label: "dance_studio" },
  ];

  return (
    <div
      className="hidden md:block"
      style={{
        position: "absolute",
        top: "50px",
        right: "20px",
        width: "250px",
        minHeight: "150px",
        maxHeight: "300px",
        zIndex: 10,
      }}
    >
      <Frame>
        <FrameHeader>
          <FrameTitle>Contact Info</FrameTitle>
        </FrameHeader>

        <FramePanel className="text-sm leading-relaxed space-y-2">
          {references.map((ref, index) => (
            <div key={index} className="flex flex-row items-center gap-2">
              <img
                src={ref.icon}
                alt="icon"
                className="w-4 h-4 grayscale dark:invert"
              />
              <span>{ref.label}</span>
            </div>
          ))}
        </FramePanel>
      </Frame>
    </div>
  );
}