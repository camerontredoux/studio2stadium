import { Link, Text } from "@react-email/components";
import { Button } from "../components/Button.js";
import { Layout } from "../components/Layout.js";
import { colors, paragraphStyle } from "../components/styles.js";

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
  /**
   * The link that claims the Org, when the purchase landed on an existing
   * account whose owner has not yet proved they read its inbox. The buyer
   * opens it signed in to that account, and the Org becomes theirs. Wins over
   * `setPasswordUrl`.
   */
  claimUrl?: string | null;
  /** How long the set-password or claim link works, as the buyer should read it. */
  setPasswordExpiry?: string;
}

const mutedStyle = {
  ...paragraphStyle,
  color: colors.textMuted,
  fontSize: "13px",
};

/**
 * Sent to an Organizer once their Event Tier purchase has been provisioned:
 * their Org and its Org Event exist, and this is how they get in. A buyer the
 * purchase created an account for sets a password first; a buyer whose
 * existing account is not yet proven theirs claims the Org; a buyer who
 * already had a proven account signs in.
 */
export function EventTierOrgReadyEmail({
  firstName,
  orgName,
  orgUrl,
  eventName,
  setPasswordUrl,
  claimUrl = null,
  setPasswordExpiry = "7 days",
}: EventTierOrgReadyEmailProps) {
  const variant = claimUrl
    ? "claim"
    : setPasswordUrl
    ? "setPassword"
    : "signIn";
  const actionUrl = claimUrl ?? setPasswordUrl ?? orgUrl;

  const preview = `Your S2S Live event, ${eventName}, is set up and ready for you.`;

  return (
    <Layout preview={preview}>
      <Text style={paragraphStyle}>Hi {firstName},</Text>
      <Text style={paragraphStyle}>
        Your S2S Live event, <strong>{eventName}</strong>, is set up and ready
        for you.
      </Text>
      {variant === "claim" ? (
        <Text style={paragraphStyle}>
          To get started, select <strong>Access your event</strong> and sign in
          to Studio 2 Stadium with this email address. If you haven&rsquo;t set
          a password yet, choose <strong>Forgot password</strong> on the sign-in
          page. Setting your password will also give you access to your
          organization&rsquo;s account.
        </Text>
      ) : variant === "setPassword" ? (
        <Text style={paragraphStyle}>
          To get started, select <strong>Access your event</strong> and set a
          password for your new Studio 2 Stadium account. After that, you can
          sign in with this email address to manage {orgName}.
        </Text>
      ) : (
        <Text style={paragraphStyle}>
          To get started, select <strong>Access your event</strong> and sign in
          to Studio 2 Stadium with this email address. If you don&rsquo;t
          remember your password, choose <strong>Forgot password</strong> on the
          sign-in page.
        </Text>
      )}
      <Button href={actionUrl}>Access your event</Button>
      <Text style={mutedStyle}>
        Or copy and paste your access link into your browser:
        <br />
        <Link href={actionUrl} style={{ color: colors.primary }}>
          {actionUrl}
        </Link>
      </Text>
      {variant !== "signIn" ? (
        <Text style={mutedStyle}>
          For security, this link can be used once and expires in{" "}
          {setPasswordExpiry}. If you received more than one access email, use
          the most recent link.
        </Text>
      ) : null}
      <Text style={paragraphStyle}>
        We&rsquo;re excited to help you bring your event together in S2S Live.
      </Text>
      <Text style={paragraphStyle}>The Studio 2 Stadium Team</Text>
    </Layout>
  );
}

export default EventTierOrgReadyEmail;
