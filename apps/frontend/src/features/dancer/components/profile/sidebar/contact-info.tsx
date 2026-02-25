import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { formatPhoneNumber } from "@/utils/format-phone";
import { InfoIcon, PhoneIcon } from "lucide-react";
import {
  AiOutlineInstagram,
  AiOutlineTikTok,
  AiOutlineYoutube,
} from "react-icons/ai";
import { type DancerProfile } from "../../../types";
import { useProfile } from "../context/use-profile";
import { ContactDialog } from "../edit/contact-dialog";

interface ContactInfoProps {
  dancer: DancerProfile;
}

export function ContactInfo({ dancer }: ContactInfoProps) {
  const { showOwnerControls } = useProfile();

  const noInfo =
    !dancer.phone && !dancer.instagram && !dancer.youtube && !dancer.tiktok;

  const phone = dancer.phone ? formatPhoneNumber(dancer.phone) : null;
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle className="flex items-center justify-between gap-2">
          Contact Information
          {showOwnerControls ? (
            <ContactDialog username={dancer.username} />
          ) : (
            <div className="h-6 w-fit" />
          )}
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
          {phone && (
            <ContactInfoItem
              icon={<PhoneIcon className="size-4" />}
              value={phone}
            />
          )}
          {dancer.instagram && (
            <ContactInfoItem
              icon={<AiOutlineInstagram className="size-5" />}
              value={dancer.instagram}
            />
          )}
          {dancer.youtube && (
            <ContactInfoItem
              icon={<AiOutlineYoutube className="size-5" />}
              value={dancer.youtube}
            />
          )}
          {dancer.tiktok && (
            <ContactInfoItem
              icon={<AiOutlineTikTok className="size-5" />}
              value={dancer.tiktok}
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
}: {
  icon: React.ReactNode;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-brand">{icon}</span>
      {value}
    </div>
  );
}
