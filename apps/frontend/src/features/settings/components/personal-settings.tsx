import { PersonalDancerSettings } from "@/features/dancer/components/settings/personal-dancer-settings";
import { PersonalSchoolSettings } from "@/features/school/components/settings/personal-school-settings";
import { useSession } from "@/lib/session";

export function PersonalSettings() {
  const session = useSession();

  return session.type === "dancer" ? (
    <PersonalDancerSettings />
  ) : (
    <PersonalSchoolSettings />
  );
}
