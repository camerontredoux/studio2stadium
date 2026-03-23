import { Text } from "@react-email/components";
import { Button } from "../components/Button.js";
import { Layout } from "../components/Layout.js";
import { paragraphStyle } from "../components/styles.js";

export interface ProfileViewedEmailProps {
  dancerName: string;
  schoolName: string;
  schoolProfileUrl: string;
  /** When true, show upgrade-focused copy for free (non-Premium) users */
  freemium?: boolean;
  /** CTA target when `freemium` is true (e.g. membership settings) */
  upgradeUrl?: string;
}

export function ProfileViewedEmail({
  dancerName,
  schoolName,
  schoolProfileUrl,
  freemium = false,
  upgradeUrl,
}: ProfileViewedEmailProps) {
  if (freemium) {
    return (
      <Layout
        preview={`A school viewed your profile — upgrade to Premium to see which one`}>
        <Text style={paragraphStyle}>Hi {dancerName},</Text>
        <Text style={paragraphStyle}>
          A school on Studio2Stadium just viewed your profile.
        </Text>
        <Text style={paragraphStyle}>
          Upgrade to Premium to see who viewed your profile and connect with
          their program.
        </Text>
        {upgradeUrl ? (
          <Button href={upgradeUrl}>Upgrade to Premium</Button>
        ) : null}
      </Layout>
    );
  }

  return (
    <Layout preview={`${schoolName} viewed your profile!`}>
      <Text style={paragraphStyle}>Hi {dancerName},</Text>
      <Text style={paragraphStyle}>
        Great news! <strong>{schoolName}</strong> just viewed your profile on
        Studio2Stadium.
      </Text>
      <Button href={schoolProfileUrl}>View Their Program</Button>
    </Layout>
  );
}

export default ProfileViewedEmail;
