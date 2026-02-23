import type { DancerProfile } from "@/features/dancer/types";
import { calculateAge } from "@/utils/calculate-age";
import { US_STATES } from "@/utils/constants/states";
import { MailIcon, MapPinIcon } from "lucide-react";
import { HeroBadge } from "./hero-badge";
import { HeroStyles } from "./hero-styles";
import { ProfilePicture } from "./profile-picture";

export function HeroContent({
  dancer,
  visible,
}: {
  dancer: DancerProfile;
  visible: boolean;
}) {
  return (
    <div className="from-brand/10 via-brand/5 to-background relative grid grid-cols-2 gap-4 bg-linear-to-br p-4 max-sm:grid-cols-1">
      <div className="flex items-center gap-4">
        <div className="block shrink-0 sm:hidden">
          <ProfilePicture avatar={dancer.avatar} />
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="truncate text-xl leading-tight font-bold tracking-tight sm:text-2xl">
            {dancer.firstName} {dancer.lastName}
          </h1>

          <div className="text-muted-foreground flex gap-x-4 gap-y-1 text-sm max-sm:flex-col sm:gap-y-2">
            <div className="flex items-center gap-1.5">
              <MapPinIcon className="text-brand size-3.5 shrink-0" />
              <span>
                {US_STATES[dancer.location as keyof typeof US_STATES]}
              </span>
            </div>
            <div className="flex min-w-0 items-center gap-1.5">
              <MailIcon className="text-brand size-3.5 shrink-0" />
              <span className="truncate" title={dancer.displayEmail}>
                {dancer.displayEmail}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 max-sm:flex-1">
        <HeroBadge
          className="border-brand/50 tracking-tight"
          label="GPA"
          value={dancer.gpa}
        />
        <HeroBadge label="Age" value={calculateAge(dancer.birthday)} />
        <HeroBadge label="Grad" value={dancer.gradYear} />
      </div>
      <HeroStyles
        visible={visible}
        styles={dancer.styles.map((style) => style.name)}
      />
    </div>
  );
}
