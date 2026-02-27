import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import type { SchoolProfile } from "@/features/school/types";
import { InfoIcon, MailIcon } from "lucide-react";
import { AiOutlineInstagram, AiOutlineTikTok } from "react-icons/ai";

interface ContactInfoProps {
  school: SchoolProfile;
}

export function ContactInfo({ school }: ContactInfoProps) {
  const noInfo =
    !school.displayEmail && !school.instagram && !school.tiktok;

  return (
    <Frame>
      <FrameHeader>
        <FrameTitle className="flex items-center justify-between gap-2">
          Contact Information
          <div className="h-6 w-fit" />
        </FrameTitle>
      </FrameHeader>
      <FramePanel side="bottom">
        <div className="flex min-w-0 flex-col gap-2">
          {noInfo ? (
            <ContactInfoItem
              icon={<InfoIcon className="size-4" />}
              value="No contact information"
            />
          ) : null}
          {school.displayEmail && (
            <ContactInfoItem
              icon={<MailIcon className="size-4" />}
              value={school.displayEmail}
              href={`mailto:${school.displayEmail}`}
            />
          )}
          {school.instagram && (
            <ContactInfoItem
              icon={<AiOutlineInstagram className="size-5" />}
              value={school.instagram}
              href={`https://instagram.com/${school.instagram.replace("@", "")}`}
            />
          )}
          {school.tiktok && (
            <ContactInfoItem
              icon={<AiOutlineTikTok className="size-5" />}
              value={school.tiktok}
              href={`https://tiktok.com/@${school.tiktok.replace("@", "")}`}
            />
          )}
        </div>
      </FramePanel>
    </Frame>
  );
}

function ContactInfoItem({
  icon,
  value,
  href,
}: {
  icon: React.ReactNode;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-2">
      <span className="text-brand">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-brand transition-colors"
      >
        {content}
      </a>
    );
  }

  return content;
}
