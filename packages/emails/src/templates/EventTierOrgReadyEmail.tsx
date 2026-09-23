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
  const variant = claimUrl ? "claim" : setPasswordUrl ? "setPassword" : "signIn";
  const actionUrl = claimUrl ?? setPasswordUrl ?? orgUrl;

  const preview = {
    claim: `${orgName} is ready. Claim it to get started.`,
    setPassword: `${orgName} is ready. Set your password to get started.`,
    signIn: `${orgName} is ready. Sign in to get started.`,
  }[variant];

  const buttonLabel = {
    claim: "Claim your Org",
    setPassword: "Set your password",
    signIn: "Sign in",
  }[variant];

  return (
    <Layout preview={preview}>
      <Text style={headingStyle}>{orgName} is ready</Text>
      <Text style={paragraphStyle}>Hi {firstName},</Text>
      {variant === "claim" ? (
        <Text style={paragraphStyle}>
          Thanks for your purchase. <strong>{eventName}</strong> has been set up
          for <strong>{orgName}</strong>. To become its admin, claim it with
          the Studio 2 Stadium account for this email address.
        </Text>
      ) : (
        <Text style={paragraphStyle}>
          Thanks for your purchase. <strong>{eventName}</strong> has been set up
          for <strong>{orgName}</strong>, and you are its admin.
        </Text>
      )}
      {variant === "claim" ? (
        <Text style={paragraphStyle}>
          Open the link below and sign in with that account when asked. If you
          don&apos;t know its password, use "Forgot password" on the sign-in
          page: setting a new password from the email we send also claims your
          Org.
        </Text>
      ) : variant === "setPassword" ? (
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
      <Button href={actionUrl}>{buttonLabel}</Button>
      <Text style={mutedStyle}>
        Or copy and paste this link into your browser:{" "}
        <Link href={actionUrl} style={{ color: colors.primary }}>
          {actionUrl}
        </Link>
      </Text>
      {variant !== "signIn" ? (
        <Text style={mutedStyle}>
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
