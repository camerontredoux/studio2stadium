import { Badge } from "@/components/ui/badge";
import type { SchoolProfile } from "@/features/school/types";
import { AvatarUploadDialog } from "@/shared/images/components/avatar-upload/avatar-upload-dialog";
import { ProfilePicture } from "@/shared/images/components/profile-picture";
import { DIVISIONS } from "@/utils/constants/divisions";
import { US_STATES } from "@/utils/constants/states";
import { GlobeIcon, MapPinIcon } from "lucide-react";
import { HeroBadge } from "./hero-badge";

const CIRCUIT_LABELS: Record<SchoolProfile["competitiveCircuit"], string> = {
  uda: "UDA",
  dtu: "DTU",
  nda: "NDA",
  usa: "USA",
  "non-competitive": "Non-Competitive",
  other: "Other",
};

const SELECTION_LABELS: Record<SchoolProfile["teamSelection"], string> = {
  recruitment: "Recruitment",
  audition: "Audition",
  hybrid: "Hybrid",
};

export function HeroContent({
  school,
  showOwnerControls,
}: {
  school: SchoolProfile;
  showOwnerControls: boolean;
}) {
  const initials = school.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="from-brand/10 via-brand/5 to-background relative grid grid-cols-2 gap-4 bg-linear-to-br p-4 max-sm:grid-cols-1">
      <div className="flex items-center gap-4">
        <div className="block shrink-0 sm:hidden">
          {showOwnerControls ? (
            <AvatarUploadDialog avatar={school.avatar} fallback={initials} />
          ) : (
            <ProfilePicture fallback={initials} avatar={school.avatar} />
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="flex items-center gap-2 text-xl leading-tight font-bold tracking-tight sm:text-2xl">
            <span className="truncate">{school.name}</span>
          </h1>

          <div className="text-muted-foreground flex gap-x-2 gap-y-1 text-sm max-sm:flex-col sm:gap-y-2">
            <div className="flex items-center gap-1.5">
              <MapPinIcon className="text-brand size-3.5 shrink-0" />
              <span className="text-nowrap">
                {US_STATES[school.location as keyof typeof US_STATES] ||
                  school.location}
              </span>
            </div>
            {school.website && (
              <a
                href={school.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand flex min-w-0 items-center gap-1.5 transition-colors"
              >
                <GlobeIcon className="text-brand size-3.5 shrink-0" />
                <span className="truncate">Website</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 max-sm:col-span-2 max-sm:flex-1">
        <HeroBadge
          className="border-brand/50 tracking-tight"
          label="GPA"
          value={school.gpa}
        />
      </div>
      <div className="col-span-2 flex flex-wrap items-center gap-2 px-1">
        <Badge variant="outline">
          {CIRCUIT_LABELS[school.competitiveCircuit]}
        </Badge>
        <Badge variant="outline">
          {SELECTION_LABELS[school.teamSelection]}
        </Badge>
        {school.division && (
          <Badge variant="outline">
            {DIVISIONS[school.division as keyof typeof DIVISIONS] ??
              school.division}
          </Badge>
        )}
      </div>
    </div>
  );
}
