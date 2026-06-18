import { Hr, Link, Section, Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { Button } from "../components/Button.js";
import {
  colors,
  headingStyle,
  linkStyle,
  paragraphStyle,
} from "../components/styles.js";

export interface OrgInviteEmailProps {
  firstName: string;
  orgName: string;
  eventName?: string | null;
  eventDateLabel?: string | null;
  venueName?: string | null;
  type: "dancer" | "coach";
  inviteUrl: string;
  brandColor?: string | null;
  welcomeVideoUrl?: string | null;
  logoUrl?: string | null;
}

function getYouTubeVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? null;
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

export function OrgInviteEmail({
  firstName,
  orgName,
  eventName,
  eventDateLabel,
  venueName,
  type,
  inviteUrl,
  brandColor,
  welcomeVideoUrl,
  logoUrl,
}: OrgInviteEmailProps) {
  const accent = brandColor || colors.primary;
  const roleWord = type === "dancer" ? "dancer" : "coach";
  const previewText = eventName
    ? `You're invited to ${eventName} with ${orgName}`
    : `You're invited to ${orgName}`;

  return (
    <Layout preview={previewText}>
      {/* Brand-accent bar */}
      <Section
        style={{
          height: "4px",
          backgroundColor: accent,
          borderRadius: "2px",
          margin: "0 0 24px",
        }}
      />

      <Text style={eyebrow}>{orgName} invitation</Text>
      <Text style={heroTitle}>
        {eventName ? `You're invited to ${eventName}` : `You're invited to ${orgName}`}
      </Text>

      <Text style={paragraphStyle}>Hi {firstName},</Text>
      <Text style={paragraphStyle}>
        {orgName} has added you as a {roleWord}
        {eventName ? ` for ${eventName}` : ""}. Claim your spot to access your
        event profile, connect with {type === "dancer" ? "coaches" : "dancers"},
        and manage your participation.
      </Text>

      {(eventName || eventDateLabel || venueName) && (
        <Section
          style={{
            backgroundColor: colors.backgroundMuted,
            border: `1px solid ${colors.border}`,
            borderLeft: `3px solid ${accent}`,
            borderRadius: "6px",
            padding: "16px 20px",
            margin: "0 0 24px",
          }}
        >
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

      {welcomeVideoUrl && (() => {
        const videoId = getYouTubeVideoId(welcomeVideoUrl);
        if (!videoId) return null;
        return (
          <Section style={{ margin: "0 0 24px", textAlign: "center" as const }}>
            <Link href={welcomeVideoUrl} style={{ textDecoration: "none" }}>
              <div
                style={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: "8px",
                  overflow: "hidden",
                  display: "inline-block",
                }}
              >
                <img
                  src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                  alt="Welcome video"
                  width={480}
                  height={360}
                  style={{ display: "block", maxWidth: "100%", height: "auto" }}
                />
              </div>
            </Link>
            <Text style={{ ...mutedText, margin: "8px 0 0", textAlign: "center" as const }}>
              Watch the welcome video
            </Text>
          </Section>
        );
      })()}

      <Button href={inviteUrl}>Claim your spot</Button>

      <Text style={mutedText}>
        Or copy and paste this link into your browser:{" "}
        <Link href={inviteUrl} style={linkStyle}>
          {inviteUrl}
        </Link>
      </Text>

      <Hr
        style={{
          borderColor: colors.border,
          margin: "32px 0 20px",
        }}
      />

      <Text style={mutedText}>
        If you weren&apos;t expecting this invitation, you can safely ignore this
        email. The link will expire in 30 days.
      </Text>
    </Layout>
  );
}

export default OrgInviteEmail;
