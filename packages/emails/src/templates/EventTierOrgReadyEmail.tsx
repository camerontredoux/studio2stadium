import { Link, Text } from "@react-email/components";
import { Button } from "../components/Button.js";
import { Layout } from "../components/Layout.js";
import { colors, headingStyle, paragraphStyle } from "../components/styles.js";

export interface EventTierOrgReadyEmailProps {
  firstName: string;
  orgName: string;
  /** Where the Organizer runs their Org: its admin area. */
  orgUrl: string;
  eventName: string;
  /**
   * The link that sets the password of the account this purchase created, or
   * null when the buyer already had an account and signs in with it.
   */
  setPasswordUrl: string | null;
  /** How long the set-password link works, as the buyer should read it. */
  setPasswordExpiry?: string;
}

/**
 * Sent to an Organizer once their Event Tier purchase has been provisioned:
 * their Org and its Org Event exist, and this is how they get in. A buyer the
 * purchase created an account for sets a password first; a buyer who already
 * had one signs in.
 */
export function EventTierOrgReadyEmail({
  firstName,
  orgName,
  orgUrl,
  eventName,
  setPasswordUrl,
  setPasswordExpiry = "7 days",
}: EventTierOrgReadyEmailProps) {
  const actionUrl = setPasswordUrl ?? orgUrl;

  return (
    <Layout
      preview={
        setPasswordUrl
          ? `${orgName} is ready. Set your password to get started.`
          : `${orgName} is ready. Sign in to get started.`
      }
    >
      <Text style={headingStyle}>{orgName} is ready</Text>
      <Text style={paragraphStyle}>Hi {firstName},</Text>
      <Text style={paragraphStyle}>
        Thanks for your purchase. <strong>{eventName}</strong> has been set up
        for <strong>{orgName}</strong>, and you are its admin.
      </Text>
      {setPasswordUrl ? (
        <Text style={paragraphStyle}>
          We created a Studio 2 Stadium account for you with this email address.
          Set your password to sign in and configure your event.
        </Text>
      ) : (
        <Text style={paragraphStyle}>
          Sign in with your existing Studio 2 Stadium account to configure your
          event. If you don&apos;t know its password, use "Forgot password" on
          the sign-in page.
        </Text>
      )}
      <Button href={actionUrl}>
        {setPasswordUrl ? "Set your password" : "Sign in"}
      </Button>
      <Text
        style={{ ...paragraphStyle, color: colors.textMuted, fontSize: "13px" }}
      >
        Or copy and paste this link into your browser:{" "}
        <Link href={actionUrl} style={{ color: colors.primary }}>
          {actionUrl}
        </Link>
      </Text>
      {setPasswordUrl ? (
        <Text
          style={{
            ...paragraphStyle,
            color: colors.textMuted,
            fontSize: "13px",
          }}
        >
          This link works once and expires in {setPasswordExpiry}. If we sent
          you more than one, use the newest. After that, use "Forgot password"
          on the sign-in page. Once you are signed in, your Org is at{" "}
          <Link href={orgUrl} style={{ color: colors.primary }}>
            {orgUrl}
          </Link>
          .
        </Text>
      ) : null}
    </Layout>
  );
}

export default EventTierOrgReadyEmail;
