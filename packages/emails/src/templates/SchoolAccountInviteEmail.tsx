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

export interface SchoolAccountInviteEmailProps {
  firstName: string;
  orgName: string;
  eventName?: string | null;
  eventDateLabel?: string | null;
  venueName?: string | null;
  registerUrl: string;
  brandColor?: string | null;
  logoUrl?: string | null;
}

const S2S_LOGO =
  "https://userdata.studio2stadium.com/logos/s2s-wordmark-white.png";

export function SchoolAccountInviteEmail({
  firstName,
  orgName,
  eventName,
  eventDateLabel,
  venueName,
  registerUrl,
  brandColor,
  logoUrl,
}: SchoolAccountInviteEmailProps) {
  const accent = brandColor || colors.primary;
  const previewText = eventName
    ? `Create your Studio2Stadium account to join ${eventName}`
    : `Create your Studio2Stadium account to join ${orgName}`;

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
          <Column style={{ textAlign: "center" as const }}>
            {logoUrl ? (
              <Img
                src={logoUrl}
                alt={orgName}
                width={160}
                height="auto"
                style={{ margin: "0 auto 12px" }}
              />
            ) : (
              <Text
                style={{
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "#ffffff",
                  textAlign: "center" as const,
                  margin: "0 0 12px",
                  fontFamily,
                }}
              >
                {orgName}
              </Text>
            )}
            <Img
              src={S2S_LOGO}
              alt="Studio 2 Stadium"
              width={200}
              height="auto"
              style={{ margin: "0 auto" }}
            />
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
          <strong>{orgName}</strong> has invited you to participate as a coach.
        </Text>
        <Text style={paragraphStyle}>
          This event software will be used{" "}
          {eventName ? (
            <>
              throughout{" "}
              <strong style={{ fontStyle: "italic" }}>{eventName}</strong>{" "}
            </>
          ) : null}
          to review dancer profiles, take notes, organize favorites, manage
          callbacks, and efficiently track dancers throughout the event. We
          encourage you to create your account before the event so you&apos;re
          ready to make the most of your experience.
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
                  fontWeight: "700" as const,
                  fontStyle: "italic" as const,
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

        {/* ── Create account section ── */}
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
            Get Started
          </Text>
          <Text style={{ ...paragraphStyle, margin: "0 0 16px" }}>
            Create your school account today so your profile is ready before
            dancers begin exploring and favoriting schools on the platform.
          </Text>
          <ReactEmailButton
            href={registerUrl}
            style={{
              display: "inline-block",
              backgroundColor: accent,
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
            <Link href={registerUrl} style={{ color: colors.primary }}>
              {registerUrl}
            </Link>
          </Text>
        </Section>

        {/* ── Closing ── */}
        <Text style={paragraphStyle}>
          We&apos;re excited to have you joining us and look forward to helping
          streamline your recruiting experience
          {eventName ? (
            <>
              {" "}
              at{" "}
              <strong style={{ fontStyle: "italic" }}>{eventName}</strong>
            </>
          ) : null}
          .
        </Text>
        <Text
          style={{
            ...paragraphStyle,
            borderTop: `1px solid ${colors.border}`,
            paddingTop: "20px",
            marginTop: "16px",
          }}
        >
          — The Studio 2 Stadium and <strong>{orgName}</strong> Teams
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
          &copy; {new Date().getFullYear()} Studio 2 Stadium &amp;{" "}
          <strong>{orgName}</strong>
        </Text>
        <Text
          style={{
            fontSize: "11px",
            color: "#666666",
            margin: "0",
            textAlign: "center" as const,
          }}
        >
          This email was sent to you as an invited coach of{" "}
          <strong>{orgName}</strong>.
        </Text>
      </Section>
    </OrgEmailLayout>
  );
}

export default SchoolAccountInviteEmail;
