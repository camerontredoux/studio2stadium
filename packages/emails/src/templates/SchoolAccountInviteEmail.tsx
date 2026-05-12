import { Hr, Link, Section, Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { Button } from "../components/Button.js";
import {
  colors,
  headingStyle,
  linkStyle,
  paragraphStyle,
} from "../components/styles.js";

export interface SchoolAccountInviteEmailProps {
  firstName: string;
  orgName: string;
  eventName?: string | null;
  eventDateLabel?: string | null;
  venueName?: string | null;
  registerUrl: string;
  brandColor?: string | null;
}

const mutedText = {
  ...paragraphStyle,
  color: colors.textMuted,
  fontSize: "14px",
};

const metaRow = {
  ...paragraphStyle,
  margin: "4px 0",
  fontSize: "15px",
  color: colors.text,
};

const eyebrow = {
  fontSize: "12px",
  fontWeight: "600" as const,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  color: colors.textMuted,
  margin: "0 0 8px",
};

const heroTitle = {
  ...headingStyle,
  fontSize: "28px",
  margin: "0 0 8px",
};

const calloutBox = (accent: string) => ({
  backgroundColor: colors.backgroundMuted,
  border: `1px solid ${colors.border}`,
  borderLeft: `3px solid ${accent}`,
  borderRadius: "6px",
  padding: "16px 20px",
  margin: "0 0 24px",
});

export function SchoolAccountInviteEmail({
  firstName,
  orgName,
  eventName,
  eventDateLabel,
  venueName,
  registerUrl,
  brandColor,
}: SchoolAccountInviteEmailProps) {
  const accent = brandColor || colors.primary;
  const previewText = eventName
    ? `Create your Studio2Stadium account to join ${eventName}`
    : `Create your Studio2Stadium account to join ${orgName}`;

  return (
    <Layout preview={previewText}>
      <Section
        style={{
          height: "4px",
          backgroundColor: accent,
          borderRadius: "2px",
          margin: "0 0 24px",
        }}
      />

      <Text style={eyebrow}>{orgName} coach invitation</Text>
      <Text style={heroTitle}>
        {eventName
          ? `You're invited to coach at ${eventName}`
          : `You're invited to ${orgName}`}
      </Text>

      <Text style={paragraphStyle}>Hi {firstName},</Text>
      <Text style={paragraphStyle}>
        {orgName} has added you as a coach
        {eventName ? ` for ${eventName}` : ""}. Create your Studio2Stadium
        school account to get instant access to your event roster and start
        connecting with your dancers.
      </Text>

      {(eventName || eventDateLabel || venueName) && (
        <Section style={calloutBox(accent)}>
          {eventName && (
            <Text
              style={{
                ...metaRow,
                fontWeight: "600" as const,
                fontSize: "16px",
              }}
            >
              {eventName}
            </Text>
          )}
          {eventDateLabel && <Text style={metaRow}>{eventDateLabel}</Text>}
          {venueName && (
            <Text style={{ ...metaRow, color: colors.textMuted }}>
              {venueName}
            </Text>
          )}
        </Section>
      )}

      <Button href={registerUrl}>Create your account</Button>

      <Text style={mutedText}>
        Or copy and paste this link into your browser:{" "}
        <Link href={registerUrl} style={linkStyle}>
          {registerUrl}
        </Link>
      </Text>

      <Hr
        style={{
          borderColor: colors.border,
          margin: "32px 0 20px",
        }}
      />

      <Text style={mutedText}>
        If you weren&apos;t expecting this invitation, you can safely ignore
        this email. The link will expire in 14 days.
      </Text>
    </Layout>
  );
}

export default SchoolAccountInviteEmail;
