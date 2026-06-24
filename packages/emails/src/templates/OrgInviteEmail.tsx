import {
  Column,
  Img,
  Link,
  Row,
  Section,
  Text,
  Button as ReactEmailButton,
} from "@react-email/components";
import { OrgEmailLayout } from "../components/OrgEmailLayout.js";
import { colors, paragraphStyle, fontFamily } from "../components/styles.js";

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

const S2S_LOGO =
  "https://d1wf5hycmlyms9.cloudfront.net/s2slogo777018b0-7579-48d1-b9b1-9f8f044ab2c0.png";

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
  const previewText = eventName
    ? `You're invited to ${eventName} with ${orgName}`
    : `You're invited to ${orgName}`;

  return (
    <OrgEmailLayout preview={previewText}>
      {/* ── Dark header ── */}
      <Section
        style={{
          backgroundColor: "#111111",
          padding: "24px 32px",
          borderRadius: "8px 8px 0 0",
        }}
      >
        <Row>
          <Column style={{ width: "20%" }} />
          <Column style={{ width: "60%", textAlign: "center" as const }}>
            {logoUrl && (
              <Img
                src={logoUrl}
                alt={orgName}
                width={120}
                height="auto"
                style={{ margin: "0 auto 12px" }}
              />
            )}
            <Text
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#ffffff",
                textAlign: "center" as const,
                margin: "0 0 4px",
                fontFamily,
              }}
            >
              {orgName}
            </Text>
          </Column>
          <Column
            className="org-email-header-logo-col"
            style={{
              width: "20%",
              textAlign: "right" as const,
              verticalAlign: "top",
            }}
          >
            <Img src={S2S_LOGO} alt="Studio 2 Stadium" width={48} height="auto" />
          </Column>
        </Row>
        <Text
          style={{
            fontSize: "11px",
            color: "#999999",
            textAlign: "center" as const,
            margin: "8px 0 0",
            letterSpacing: "0.05em",
          }}
        >
          Featuring Technology From Studio 2 Stadium
        </Text>
      </Section>

      {/* ── White body ── */}
      <Section
        style={{
          backgroundColor: "#ffffff",
          padding: "32px",
          borderLeft: `1px solid ${colors.border}`,
          borderRight: `1px solid ${colors.border}`,
        }}
      >
        <Text style={paragraphStyle}>Hi {firstName},</Text>
        <Text style={paragraphStyle}>
          {eventName ? (
            <>
              <strong>{eventName}</strong> is almost here and we&apos;re excited
              to have you involved!
            </>
          ) : (
            `${orgName} has invited you to join and we're excited to have you!`
          )}
        </Text>
        <Text style={paragraphStyle}>
          {type === "dancer"
            ? `The ${orgName} platform gives you one place to explore opportunities, connect with coaches, and stay organized${eventName ? " throughout the event" : ""}.`
            : `The ${orgName} platform gives you one place to explore dancer profiles, identify top prospects, and stay organized${eventName ? " throughout the event" : ""}.`}
        </Text>

        {/* Event details (if available) */}
        {(eventDateLabel || venueName) && (
          <Section
            style={{
              backgroundColor: colors.backgroundMuted,
              borderLeft: `3px solid ${accent}`,
              borderRadius: "4px",
              padding: "12px 16px",
              margin: "0 0 24px",
            }}
          >
            {eventName && (
              <Text
                style={{
                  ...paragraphStyle,
                  fontWeight: "600" as const,
                  margin: "0 0 4px",
                }}
              >
                {eventName}
              </Text>
            )}
            {eventDateLabel && (
              <Text style={{ ...paragraphStyle, margin: "0 0 4px", fontSize: "14px" }}>
                {eventDateLabel}
              </Text>
            )}
            {venueName && (
              <Text
                style={{
                  ...paragraphStyle,
                  margin: "0",
                  fontSize: "14px",
                  color: colors.textMuted,
                }}
              >
                {venueName}
              </Text>
            )}
          </Section>
        )}

        {/* ── New to S2S section ── */}
        <Section
          style={{
            borderLeft: `4px solid ${accent}`,
            padding: "16px 20px",
            margin: "0 0 24px",
          }}
        >
          <Text
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: colors.text,
              margin: "0 0 8px",
            }}
          >
            If you&apos;re new to S2S:
          </Text>
          <Text style={{ ...paragraphStyle, margin: "0 0 16px" }}>
            You&apos;ll need to create an account to access the{" "}
            {eventName ?? orgName} platform:
          </Text>
          <ReactEmailButton
            href={inviteUrl}
            style={{
              display: "inline-block",
              backgroundColor: colors.primary,
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: "600",
              padding: "10px 24px",
              borderRadius: "6px",
              textDecoration: "none",
            }}
          >
            Create Account
          </ReactEmailButton>
          <Text
            style={{
              fontSize: "12px",
              color: colors.textMuted,
              margin: "12px 0 0",
              wordBreak: "break-all" as const,
            }}
          >
            Or copy and paste this link:{" "}
            <Link href={inviteUrl} style={{ color: colors.primary }}>
              {inviteUrl}
            </Link>
          </Text>
        </Section>

        {/* ── Welcome video card ── */}
        {welcomeVideoUrl && (
          <Section
            style={{
              backgroundColor: "#1a1a1a",
              borderRadius: "8px",
              padding: "24px",
              margin: "0 0 24px",
            }}
          >
            <Text
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#ffffff",
                margin: "0 0 8px",
              }}
            >
              Get Started Guide
            </Text>
            <Text
              style={{
                fontSize: "14px",
                lineHeight: "1.5",
                color: "#cccccc",
                margin: "0 0 16px",
              }}
            >
              We&apos;ve put together a quick walkthrough of the sign-up process
              and how to navigate the platform:
            </Text>
            <ReactEmailButton
              href={welcomeVideoUrl}
              style={{
                display: "inline-block",
                backgroundColor: colors.primary,
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "600",
                padding: "10px 24px",
                borderRadius: "6px",
                textDecoration: "none",
              }}
            >
              Watch Tutorial Video
            </ReactEmailButton>
          </Section>
        )}

        {/* ── Closing ── */}
        <Text style={paragraphStyle}>
          We&apos;re excited for you to take advantage of everything the
          platform offers
          {eventName ? ` and make the most of your time at ${eventName}` : ""}.
        </Text>
        <Text
          style={{
            ...paragraphStyle,
            borderTop: `1px solid ${colors.border}`,
            paddingTop: "20px",
            marginTop: "16px",
          }}
        >
          — The Studio 2 Stadium and {orgName} Teams
        </Text>
      </Section>

      {/* ── Dark footer ── */}
      <Section
        style={{
          backgroundColor: "#111111",
          padding: "20px 32px",
          borderRadius: "0 0 8px 8px",
          textAlign: "center" as const,
        }}
      >
        <Text
          style={{
            fontSize: "12px",
            color: "#999999",
            margin: "0 0 4px",
            textAlign: "center" as const,
          }}
        >
          &copy; {new Date().getFullYear()} Studio 2 Stadium &amp; {orgName}
        </Text>
        <Text
          style={{
            fontSize: "11px",
            color: "#666666",
            margin: "0",
            textAlign: "center" as const,
          }}
        >
          This email was sent to you as a registered participant of {orgName}.
        </Text>
      </Section>
    </OrgEmailLayout>
  );
}

export default OrgInviteEmail;
